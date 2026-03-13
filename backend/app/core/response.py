from typing import Any, Optional, Dict, List
from pydantic import BaseModel

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    meta: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None

def success_response(data: Any = None, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "meta": meta,
        "errors": None
    }

def error_response(errors: List[str], status_code: int = 400) -> Dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "meta": None,
        "errors": errors
    }
