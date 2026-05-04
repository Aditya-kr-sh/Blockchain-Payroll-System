from flask import Blueprint, jsonify, request
from models.db import get_db_connection
from blockchain.audit_chain import audit_chain
from utils.auth_utils import get_request_domain
import json

blockchain_bp = Blueprint('blockchain_bp', __name__)

@blockchain_bp.route('/chain', methods=['GET'])
def get_chain():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    try:
        audit_chain._load_chain_from_db()
    except Exception:
        pass
        
    chain = []
    # Filter blocks: include the global Genesis Block + organization specific blocks
    for block in audit_chain.chain:
        if not isinstance(block, dict): continue
        
        is_genesis = block.get('block_index') == 0
        is_org_block = block.get('org_domain') == domain
        
        if is_genesis or is_org_block:
            b = dict(block)
            if isinstance(b.get('data'), str):
                try:
                    b['data'] = json.loads(b['data'])
                except Exception:
                    pass
            chain.append(b)
            
    return jsonify(chain), 200

@blockchain_bp.route('/verify', methods=['GET'])
def verify_chain():
    """Verify the integrity of a company's specific block thread (or global chain link)."""
    # Simply verify the full chain integrity for all entries globally
    chain = audit_chain.chain
    is_valid = True
    errors = []
    for i in range(1, len(chain)):
        current = chain[i]
        previous = chain[i - 1]
        
        curr_prev_hash = current.get('previous_hash') if isinstance(current, dict) else current[3]
        prev_hash = previous.get('hash') if isinstance(previous, dict) else previous[4]
        
        if curr_prev_hash != prev_hash:
            is_valid = False
            errors.append(f"Block {i} has invalid link to previous block.")
            
    return jsonify({"valid": is_valid, "total_blocks": len(chain), "errors": errors}), 200
