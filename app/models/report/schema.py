from datetime import datetime
from bson import ObjectId
from typing import Optional


class ReportSchema:
    @staticmethod
    def create_report_document(data: dict) -> dict:
        """Create a report document for MongoDB"""
        return {
            'reporter_id': ObjectId(data['reporter_id']),
            'reported_item_id': data['reported_item_id'],
            'reported_item_type': data['reported_item_type'],  # 'ad' or 'user'
            'reason': data['reason'],
            'details': data.get('details', ''),
            'status': 'pending',  # pending, reviewed, resolved, dismissed
            'admin_response': None,
            'admin_notes': None,
            'reviewed_by': None,
            'reviewed_at': None,
            'resolved_at': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def update_report_document(updates: dict) -> dict:
        """Update a report document"""
        update_data = updates.copy()
        update_data['updated_at'] = datetime.utcnow()
        
        if 'status' in updates and updates['status'] in ['reviewed', 'resolved', 'dismissed']:
            if 'reviewed_at' not in update_data:
                update_data['reviewed_at'] = datetime.utcnow()
                
        if 'status' in updates and updates['status'] == 'resolved':
            if 'resolved_at' not in update_data:
                update_data['resolved_at'] = datetime.utcnow()
        
        return update_data

    @staticmethod
    def format_report_response(report: dict) -> dict:
        """Format report document for API response"""
        if not report:
            return None
            
        return {
            '_id': str(report['_id']),
            'reporter_id': str(report['reporter_id']),
            'reported_item_id': report['reported_item_id'],
            'reported_item_type': report['reported_item_type'],
            'reason': report['reason'],
            'details': report.get('details', ''),
            'status': report['status'],
            'admin_response': report.get('admin_response'),
            'admin_notes': report.get('admin_notes'),
            'reviewed_by': report.get('reviewed_by'),
            'reviewed_at': report.get('reviewed_at'),
            'resolved_at': report.get('resolved_at'),
            'created_at': report['created_at'],
            'updated_at': report['updated_at']
        }