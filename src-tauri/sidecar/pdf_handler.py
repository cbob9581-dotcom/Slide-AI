"""
PDF 文档解析处理
使用 PyMuPDF (fitz) 进行 PDF 渲染和文本提取
"""
import os
import fitz  # PyMuPDF


def parse_pdf(path: str, out_dir: str) -> dict:
    """解析 PDF 文件，生成页面图片、缩略图和提取文本"""
    try:
        doc = fitz.open(path)
    except Exception as e:
        return {"status": "error", "message": f"Failed to open PDF: {e}"}

    pages = []
    total = len(doc)

    for i in range(total):
        page = doc[i]
        page_num = i + 1

        try:
            # 渲染全分辨率图片 (150 DPI)
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = page.get_pixmap(matrix=mat)
            img_path = os.path.join(out_dir, f"page_{page_num}.png")
            pix.save(img_path)

            # 缩略图 (75 DPI)
            mat2 = fitz.Matrix(75 / 72, 75 / 72)
            thumb = page.get_pixmap(matrix=mat2)
            thumb_path = os.path.join(out_dir, f"thumb_{page_num}.png")
            thumb.save(thumb_path)

            # 提取文本
            text = page.get_text("text")

            # 如果文本很少，可能是扫描版 → 尝试 OCR
            if len(text.strip()) < 20:
                try:
                    from ocr_handler import ocr_image
                    text = ocr_image(img_path)
                except ImportError:
                    pass  # OCR 不可用时使用原始文本

            pages.append({
                "page_number": page_num,
                "image_path": img_path,
                "thumbnail_path": thumb_path,
                "extracted_text": text.strip(),
                "speaker_notes": "",
            })

        except Exception as e:
            # 单页失败不阻塞整体处理
            pages.append({
                "page_number": page_num,
                "image_path": "",
                "thumbnail_path": "",
                "extracted_text": f"[Page {page_num} extraction failed: {e}]",
                "speaker_notes": "",
            })

    doc.close()

    return {
        "status": "ok",
        "total_pages": total,
        "pages": pages,
    }
