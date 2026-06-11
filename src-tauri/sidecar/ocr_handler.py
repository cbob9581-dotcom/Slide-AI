"""
OCR 文字识别处理
优先使用 PaddleOCR，回退到 Tesseract
"""
import os


def ocr_image(image_path: str) -> str:
    """对图片进行 OCR 文字识别"""
    if not os.path.exists(image_path):
        return ""

    # 尝试 PaddleOCR
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
        result = ocr.ocr(image_path, cls=True)
        if result and result[0]:
            lines = [line[1][0] for line in result[0] if line and len(line) > 1]
            return "\n".join(lines)
    except ImportError:
        pass
    except Exception:
        pass

    # 回退到 Tesseract
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img, lang='chi_sim+eng')
        return text.strip()
    except ImportError:
        pass
    except Exception:
        pass

    return "[OCR 不可用 — 请安装 PaddleOCR 或 Tesseract]"
