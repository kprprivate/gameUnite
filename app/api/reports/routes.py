from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.report.report_service import ReportService
from app.utils.decorators.permissions import admin_required
from app.utils.helpers.response_helpers import create_response

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/create', methods=['POST'])
@jwt_required()
def create_report():
    """Create a new report"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify(create_response(False, 'Dados inválidos', status_code=400)), 400
        
        # Add reporter ID to data
        data['reporter_id'] = current_user_id
        
        # Create report
        result = ReportService.create_report(data)
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        return jsonify(create_response(False, 'Erro interno do servidor', status_code=500)), 500


@reports_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_reports():
    """Get all reports (admin only)"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status')
        reported_item_type = request.args.get('type')
        reason = request.args.get('reason')
        
        # Build filters
        filters = {}
        if status:
            filters['status'] = status
        if reported_item_type:
            filters['reported_item_type'] = reported_item_type
        if reason:
            filters['reason'] = reason
        
        # Get reports
        result = ReportService.get_reports(filters, page, limit)
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        return jsonify(create_response(False, 'Erro interno do servidor', status_code=500)), 500


@reports_bp.route('/<report_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_report(report_id):
    """Get a specific report (admin only)"""
    try:
        result = ReportService.get_report_by_id(report_id)
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        return jsonify(create_response(False, 'Erro interno do servidor', status_code=500)), 500


@reports_bp.route('/<report_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_report_status(report_id):
    """Update report status (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify(create_response(False, 'Status é obrigatório', status_code=400)), 400
        
        status = data['status']
        admin_notes = data.get('admin_notes')
        
        # Update report
        result = ReportService.update_report_status(
            report_id, 
            status, 
            admin_notes, 
            reviewed_by=current_user_id
        )
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        return jsonify(create_response(False, 'Erro interno do servidor', status_code=500)), 500


@reports_bp.route('/statistics', methods=['GET'])
@jwt_required()
@admin_required
def get_report_statistics():
    """Get report statistics (admin only)"""
    try:
        result = ReportService.get_report_statistics()
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        return jsonify(create_response(False, 'Erro interno do servidor', status_code=500)), 500