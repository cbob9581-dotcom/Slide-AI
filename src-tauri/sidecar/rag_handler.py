"""
RAG 向量检索处理
使用 sentence-transformers 进行本地向量化和 sqlite-vec 进行检索
"""
import json
import sqlite3
import os


# 延迟加载模型（首次使用时加载）
_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # 多语言模型，支持中文
            _model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        except ImportError:
            raise ImportError(
                "sentence-transformers not installed. "
                "Install with: pip install sentence-transformers"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load embedding model: {e}")
    return _model


def _get_db(db_path: str) -> sqlite3.Connection:
    """获取数据库连接"""
    conn = sqlite3.connect(db_path)
    conn.enable_load_extension(True)
    # 尝试加载 sqlite-vec 扩展
    try:
        import sqlite_vec
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
    except (ImportError, Exception):
        pass  # sqlite-vec 不可用，回退到简单检索
    conn.enable_load_extension(False)
    return conn


def _init_tables(conn: sqlite3.Connection):
    """初始化向量检索表"""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id TEXT NOT NULL,
            page_num INTEGER NOT NULL,
            text TEXT NOT NULL,
            embedding TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id)
    """)
    conn.commit()


def vectorize(document_id: str, pages: list, db_path: str = "slide-ai.db") -> dict:
    """对文档页面进行向量化存储"""
    try:
        model = _get_model()
        conn = _get_db(db_path)
        _init_tables(conn)

        # 清除旧数据
        conn.execute("DELETE FROM chunks WHERE doc_id = ?", (document_id,))

        for page in pages:
            # 合并文本
            text_parts = [
                page.get("extracted_text", ""),
                page.get("speaker_notes", ""),
                page.get("explanation", ""),
            ]
            text = " ".join(filter(None, text_parts))

            if not text.strip():
                continue

            # 分块（简单按段落分）
            chunks = _chunk_text(text, page.get("page_number", 0))

            for chunk in chunks:
                try:
                    vec = model.encode(chunk["text"]).tolist()
                    conn.execute(
                        "INSERT INTO chunks(doc_id, page_num, text, embedding) VALUES (?, ?, ?, ?)",
                        (document_id, chunk["page_num"], chunk["text"], json.dumps(vec)),
                    )
                except Exception as e:
                    print(f"Warning: failed to vectorize chunk: {e}", file=__import__('sys').stderr)
                    continue

        conn.commit()
        conn.close()
        return {"status": "ok"}

    except ImportError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def search(document_id: str, query: str, top_k: int = 4, db_path: str = "slide-ai.db") -> dict:
    """向量搜索相关页面"""
    try:
        model = _get_model()
        conn = _get_db(db_path)
        _init_tables(conn)

        # 编码查询向量
        q_vec = model.encode(query).tolist()
        q_vec_json = json.dumps(q_vec)

        # 尝试 sqlite-vec 余弦距离检索
        try:
            rows = conn.execute("""
                SELECT page_num, text, embedding
                FROM chunks
                WHERE doc_id = ?
                ORDER BY vec_distance_cosine(embedding, ?)
                LIMIT ?
            """, (document_id, q_vec_json, top_k)).fetchall()
        except Exception:
            # 回退：计算所有向量的余弦相似度
            all_rows = conn.execute(
                "SELECT page_num, text, embedding FROM chunks WHERE doc_id = ?",
                (document_id,),
            ).fetchall()

            import math

            def cosine_similarity(v1, v2):
                dot = sum(a * b for a, b in zip(v1, v2))
                norm1 = math.sqrt(sum(a * a for a in v1))
                norm2 = math.sqrt(sum(b * b for b in v2))
                if norm1 == 0 or norm2 == 0:
                    return 0
                return dot / (norm1 * norm2)

            scored = []
            for row in all_rows:
                try:
                    emb = json.loads(row[2])
                    sim = cosine_similarity(q_vec, emb)
                    scored.append((sim, row[0], row[1]))
                except Exception:
                    continue

            scored.sort(key=lambda x: x[0], reverse=True)
            rows = [(r[1], r[2]) for r in scored[:top_k]]

        results = [{"page_num": r[0], "text": r[1]} for r in rows]
        conn.close()

        return {"results": results}

    except ImportError as e:
        return {"status": "error", "message": str(e), "results": []}
    except Exception as e:
        return {"status": "error", "message": str(e), "results": []}


def _chunk_text(text: str, page_num: int, max_chunk_size: int = 500) -> list:
    """将文本分块"""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) > max_chunk_size and current:
            chunks.append({"text": current.strip(), "page_num": page_num})
            current = para
        else:
            current += "\n\n" + para if current else para

    if current.strip():
        chunks.append({"text": current.strip(), "page_num": page_num})

    return chunks
