from datetime import datetime
from bson import ObjectId
from flask import current_app
from pymongo import DESCENDING
from app.db.mongo_client import db
from app.models.report.schema import ReportSchema
from app.utils.helpers.response_helpers import create_response


class ReportService:
    
    @staticmethod
    def create_report(data):
        """Create a new report"""
        try:
            # Validate required fields
            required_fields = ['reporter_id', 'reported_item_id', 'reported_item_type', 'reason']
            for field in required_fields:
                if field not in data or not data[field]:
                    return create_response(False, f'Campo obrigatório: {field}', status_code=400)
            
            # Validate reported_item_type
            if data['reported_item_type'] not in ['ad', 'user', 'order']:
                return create_response(False, 'Tipo de item inválido', status_code=400)
            
            # Validate reason
            valid_reasons = [
                'spam', 'fake', 'inappropriate', 'scam', 'wrong_category', 'other',
                'payment_issue', 'delivery_issue', 'product_issue', 'seller_issue', 
                'buyer_issue', 'communication_issue', 'fraud'
            ]
            if data['reason'] not in valid_reasons:
                return create_response(False, 'Motivo inválido', status_code=400)
            
            # Check if user already reported this item
            existing_report = db.reports.find_one({
                'reporter_id': ObjectId(data['reporter_id']),
                'reported_item_id': data['reported_item_id'],
                'reported_item_type': data['reported_item_type']
            })
            
            if existing_report:
                return create_response(False, 'Você já reportou este item', status_code=400)
            
            # Create report document
            report_doc = ReportSchema.create_report_document(data)
            
            # Insert into database
            result = db.reports.insert_one(report_doc)
            
            if result.inserted_id:
                # Get the created report with populated data
                report = ReportService.get_report_by_id(str(result.inserted_id))
                return create_response(True, 'Report criado com sucesso', {'report': report['data']['report']})
            else:
                return create_response(False, 'Erro ao criar report', status_code=500)
                
        except Exception as e:
            current_app.logger.error(f"Erro ao criar report: {str(e)}")
            return create_response(False, 'Erro interno do servidor', status_code=500)
    
    @staticmethod
    def get_reports(filters=None, page=1, limit=50):
        """Get reports with optional filtering"""
        try:
            # Check if reports collection exists
            if 'reports' not in db.list_collection_names():
                # Collection doesn't exist, return empty results
                return create_response(True, 'Nenhum report encontrado', {
                    'reports': [],
                    'pagination': {
                        'current_page': page,
                        'total_pages': 0,
                        'total_reports': 0,
                        'has_next': False,
                        'has_prev': False,
                        'per_page': limit
                    }
                })
            
            # Build query
            query = {}
            if filters:
                if 'status' in filters and filters['status']:
                    query['status'] = filters['status']
                if 'reported_item_type' in filters and filters['reported_item_type']:
                    query['reported_item_type'] = filters['reported_item_type']
                if 'reason' in filters and filters['reason']:
                    query['reason'] = filters['reason']
            
            # Calculate skip
            skip = (page - 1) * limit
            
            # Get total count first
            total_reports = db.reports.count_documents(query)
            
            if total_reports == 0:
                return create_response(True, 'Nenhum report encontrado', {
                    'reports': [],
                    'pagination': {
                        'current_page': page,
                        'total_pages': 0,
                        'total_reports': 0,
                        'has_next': False,
                        'has_prev': False,
                        'per_page': limit
                    }
                })
            
            # Aggregation pipeline to populate reporter data
            pipeline = [
                {'$match': query},
                {'$lookup': {
                    'from': 'users',
                    'localField': 'reporter_id',
                    'foreignField': '_id',
                    'as': 'reporter'
                }},
                {'$unwind': {
                    'path': '$reporter',
                    'preserveNullAndEmptyArrays': True
                }},
                {'$sort': {'created_at': DESCENDING}},
                {'$skip': skip},
                {'$limit': limit},
                {'$project': {
                    '_id': 1,
                    'reported_item_id': 1,
                    'reported_item_type': 1,
                    'reason': 1,
                    'details': 1,
                    'status': 1,
                    'admin_response': 1,
                    'admin_notes': 1,
                    'reviewed_by': 1,
                    'reviewed_at': 1,
                    'resolved_at': 1,
                    'created_at': 1,
                    'updated_at': 1,
                    'reporter': {
                        '_id': 1,
                        'username': 1,
                        'first_name': 1,
                        'last_name': 1,
                        'email': 1
                    }
                }}
            ]
            
            # Execute aggregation
            reports_cursor = db.reports.aggregate(pipeline)
            reports = list(reports_cursor)
            
            # Convert ObjectIds to strings and handle missing reporter data
            for report in reports:
                report['_id'] = str(report['_id'])
                if 'reporter' in report and report['reporter']:
                    report['reporter']['_id'] = str(report['reporter']['_id'])
                else:
                    # Handle case where reporter doesn't exist
                    report['reporter'] = {
                        '_id': '',
                        'username': 'Usuário removido',
                        'first_name': 'Usuário',
                        'last_name': 'removido',
                        'email': ''
                    }
            
            # Calculate pagination info
            total_pages = (total_reports + limit - 1) // limit
            has_next = page < total_pages
            has_prev = page > 1
            
            return create_response(True, 'Reports encontrados', {
                'reports': reports,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_reports': total_reports,
                    'has_next': has_next,
                    'has_prev': has_prev,
                    'per_page': limit
                }
            })
            
        except Exception as e:
            current_app.logger.error(f"Erro ao buscar reports: {str(e)}")
            return create_response(False, 'Erro interno do servidor', status_code=500)
    
    @staticmethod
    def get_report_by_id(report_id):
        """Get a specific report by ID"""
        try:
            # Aggregation pipeline to populate reporter data
            pipeline = [
                {'$match': {'_id': ObjectId(report_id)}},
                {'$lookup': {
                    'from': 'users',
                    'localField': 'reporter_id',
                    'foreignField': '_id',
                    'as': 'reporter'
                }},
                {'$unwind': '$reporter'},
                {'$project': {
                    '_id': 1,
                    'reported_item_id': 1,
                    'reported_item_type': 1,
                    'reason': 1,
                    'details': 1,
                    'status': 1,
                    'admin_response': 1,
                    'admin_notes': 1,
                    'reviewed_by': 1,
                    'reviewed_at': 1,
                    'resolved_at': 1,
                    'created_at': 1,
                    'updated_at': 1,
                    'reporter': {
                        '_id': 1,
                        'username': 1,
                        'first_name': 1,
                        'last_name': 1,
                        'email': 1
                    }
                }}
            ]
            
            # Execute aggregation
            reports_cursor = db.reports.aggregate(pipeline)
            reports = list(reports_cursor)
            
            if not reports:
                return create_response(False, 'Report não encontrado', status_code=404)
            
            report = reports[0]
            
            # Convert ObjectIds to strings
            report['_id'] = str(report['_id'])
            report['reporter']['_id'] = str(report['reporter']['_id'])
            
            return create_response(True, 'Report encontrado', {'report': report})
            
        except Exception as e:
            current_app.logger.error(f"Erro ao buscar report: {str(e)}")
            return create_response(False, 'Erro interno do servidor', status_code=500)
    
    @staticmethod
    def update_report_status(report_id, status, admin_notes=None, reviewed_by=None):
        """Update report status and admin notes"""
        try:
            # Validate status
            valid_statuses = ['pending', 'reviewed', 'resolved', 'dismissed']
            if status not in valid_statuses:
                return create_response(False, 'Status inválido', status_code=400)
            
            # Prepare update data
            update_data = {'status': status}
            if admin_notes:
                update_data['admin_notes'] = admin_notes
            if reviewed_by:
                update_data['reviewed_by'] = reviewed_by
            
            # Use schema to format update
            formatted_update = ReportSchema.update_report_document(update_data)
            
            # Update in database
            result = db.reports.update_one(
                {'_id': ObjectId(report_id)},
                {'$set': formatted_update}
            )
            
            if result.modified_count == 0:
                return create_response(False, 'Report não encontrado ou não modificado', status_code=404)
            
            # Get updated report
            updated_report = ReportService.get_report_by_id(report_id)
            return create_response(True, 'Report atualizado com sucesso', updated_report['data'])
            
        except Exception as e:
            current_app.logger.error(f"Erro ao atualizar report: {str(e)}")
            return create_response(False, 'Erro interno do servidor', status_code=500)
    
    @staticmethod
    def get_report_statistics():
        """Get report statistics for admin dashboard"""
        try:
            # Check if reports collection exists
            if 'reports' not in db.list_collection_names():
                # Collection doesn't exist, return zero stats
                stats = {
                    'pending': 0,
                    'reviewed': 0,
                    'resolved': 0,
                    'dismissed': 0,
                    'total': 0,
                    'recent_reports': 0
                }
                return create_response(True, 'Estatísticas obtidas', {'statistics': stats})
            
            # Aggregate statistics
            pipeline = [
                {
                    '$group': {
                        '_id': '$status',
                        'count': {'$sum': 1}
                    }
                }
            ]
            
            status_stats = list(db.reports.aggregate(pipeline))
            
            # Convert to dictionary
            stats = {
                'pending': 0,
                'reviewed': 0,
                'resolved': 0,
                'dismissed': 0,
                'total': 0
            }
            
            for stat in status_stats:
                if stat['_id'] in stats:  # Check if status is valid
                    stats[stat['_id']] = stat['count']
                    stats['total'] += stat['count']
            
            # Get recent reports count (last 7 days)
            from datetime import timedelta
            week_ago = datetime.utcnow() - timedelta(days=7)
            try:
                recent_count = db.reports.count_documents({
                    'created_at': {'$gte': week_ago}
                })
            except:
                recent_count = 0
            
            stats['recent_reports'] = recent_count
            
            return create_response(True, 'Estatísticas obtidas', {'statistics': stats})
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter estatísticas: {str(e)}")
            return create_response(False, 'Erro interno do servidor', status_code=500)