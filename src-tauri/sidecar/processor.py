#!/usr/bin/env python3
"""
Slide AI - Python Document Processor Sidecar
通过 stdin/stdout JSON 通信，接收指令，返回结果。

打包方式：PyInstaller --onefile processor.py -n python-sidecar
"""
import sys
import json
import os


def handle(cmd: dict) -> dict:
    action = cmd.get("action", "")

    if action == "parse_document":
        path = cmd.get("path", "")
        out_dir = cmd.get("out_dir", "")

        if not path or not out_dir:
            return {"status": "error", "message": "Missing path or out_dir"}

        os.makedirs(out_dir, exist_ok=True)

        ext = os.path.splitext(path.lower())[1]

        if ext == ".pdf":
            from pdf_handler import parse_pdf
            return parse_pdf(path, out_dir)
        elif ext in (".ppt", ".pptx"):
            from ppt_handler import parse_ppt
            return parse_ppt(path, out_dir)
        else:
            return {"status": "error", "message": f"Unsupported file type: {ext}"}

    elif action == "vectorize_document":
        try:
            from rag_handler import vectorize
            doc_id = cmd.get("document_id", "")
            pages = cmd.get("pages", [])
            db_path = cmd.get("db_path", "slide-ai.db")
            return vectorize(doc_id, pages, db_path)
        except ImportError:
            return {"status": "error", "message": "RAG module not available"}

    elif action == "search":
        try:
            from rag_handler import search
            doc_id = cmd.get("document_id", "")
            query = cmd.get("query", "")
            top_k = cmd.get("top_k", 4)
            db_path = cmd.get("db_path", "slide-ai.db")
            return search(doc_id, query, top_k, db_path)
        except ImportError:
            return {"status": "error", "message": "RAG module not available"}

    else:
        return {"status": "error", "message": f"Unknown action: {action}"}


def main():
    for line in sys.stdin:
        try:
            line = line.strip()
            if not line:
                continue
            cmd = json.loads(line)
            result = handle(cmd)
            print(json.dumps(result, ensure_ascii=False), flush=True)
        except json.JSONDecodeError as e:
            err = {"status": "error", "message": f"JSON parse error: {e}"}
            print(json.dumps(err, ensure_ascii=False), flush=True)
        except Exception as e:
            err = {"status": "error", "message": str(e)}
            print(json.dumps(err, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
