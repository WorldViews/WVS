"""
Models to represent track
"""
from mongoengine import (Document, EmbeddedDocument, EmbeddedDocumentField, EmbeddedDocumentListField,
    FloatField, BooleanField, StringField, ListField)
from flask_worldviews.Accounts import admin, MyModelView
from flask_admin.form import rules

class TrackPosition(EmbeddedDocument):
    """
    position record in a track
    """
    rt = FloatField()
    time = FloatField()
    pos = ListField(FloatField())

class Track(Document):
    """
    Track path model
    """
    coordinateSystem = StringField(max_length=255)
    duration = FloatField()
    startTime = FloatField()
    endTime = FloatField()
    haveAltitude = BooleanField()
    locked = BooleanField()
    name = StringField(max_length=255)
    recs = ListField(EmbeddedDocumentField(TrackPosition))

class TrackModelView(MyModelView):
    inline_models = ['recs', ]
    form_subdocuments = {
        'recs': {
            'form_subdocuments': {
                None: {
                    'form_rules': ('rt', 'time', 'pos', rules.HTML('<hr>')),
                    }
                }
            }
        }
    # column_exclude_list = ['recs', ]

admin.add_view(TrackModelView(Track))
