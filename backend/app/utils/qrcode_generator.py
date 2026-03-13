import hmac
import hashlib
import qrcode
from io import BytesIO
import base64
from typing import Tuple

def generate_qr_hash(data: str, secret: str) -> str:
    """Generate HMAC-SHA256 hash for QR code."""
    return hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()

def generate_qr_code_image(data: str, size: int = 10, border: int = 2) -> str:
    """Generate QR code image and return as base64 string."""
    qr = qrcode.QRCode(version=1, box_size=size, border=border)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}"

def generate_digital_card_qr(member_id: str, org_id: str, secret: str) -> Tuple[str, str]:
    """
    Generate QR code for digital member card.
    Returns: (qr_hash, qr_code_image_base64)
    """
    # Create data string with member and org info
    data = f"{member_id}:{org_id}"
    qr_hash = generate_qr_hash(data, secret)
    qr_image = generate_qr_code_image(qr_hash)
    
    return qr_hash, qr_image
