from flask import request, jsonify
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def extract_domain(email):
    return email.split('@')[-1] if email and '@' in email else None

def get_request_domain():
    # Priority: Header > Query Param
    domain = request.headers.get('X-Org-Domain')
    if not domain:
        domain = request.args.get('org_domain')
    return domain

def role_required(allowed_roles):
    """
    Decorator to ensure user has a specific role (Employee, Manager, HR, Admin).
    Verifies JWT and checks the 'role' claim.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                user_role = claims.get('role')
                if user_role not in allowed_roles:
                    return jsonify({"error": f"Access restricted. Required roles: {allowed_roles}"}), 403
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({"error": f"Authentication required: {str(e)}"}), 401
        return decorator
    return wrapper

def require_domain(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        domain = get_request_domain()
        if not domain:
            return jsonify({"error": "Organization domain (X-Org-Domain header) is required"}), 400
        return f(domain, *args, **kwargs)
    return decorated
