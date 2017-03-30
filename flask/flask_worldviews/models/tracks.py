"""
Models to represent track
"""
import os
import time
import urllib2
import json
import gpxpy

from mongoengine import (Document, EmbeddedDocument, EmbeddedDocumentField,
                         FloatField, BooleanField, StringField, ListField)
from flask_worldviews.Accounts import admin, MyModelView
from flask_worldviews import app
from flask_admin.form import rules
import flask_admin
from wtforms import fields, validators

from flask_admin.contrib.fileadmin import FileAdmin
from flask_admin.babel import gettext, lazy_gettext

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

    def __unicode__(self):
        return self.name

    @staticmethod
    def parseJSON(path):
        with open(path) as data_file:    
            data = json.load(data_file)
            return Track(**data)
        return None

    @staticmethod
    def parseGPX(path, haveAltitude=False):
        """
        path could be a local file path or a url
        """
        print path
        name = os.path.splitext(os.path.basename(path))[0]
        print name
        indexObj = {}
        indexObj['coordinateSystem'] = "GEO"
        indexObj['name'] = name
        indexObj['locked'] = False
        indexObj['haveAltitude'] = haveAltitude
        if path.startswith("http:") or path.startswith("https:"):
            gpx_file = urllib2.urlopen(path)
        else:
            gpx_file = open(path, 'r')
        gpx = gpxpy.parse(gpx_file) 
        if len(gpx.tracks) > 1:
            print "**** Warning multiple tracks unexpected"
        track = gpx.tracks[0]
        if len(track.segments) > 1:
            print "**** Warning multiple segments in track"
        seg = track.segments[0]
        print seg
        recs = []
        t0 = None
        for point in seg.points:
            lat = point.latitude
            lon = point.longitude
            alt = point.elevation
            ts = point.time
            #print lat, lon, alt, ts,
            tup = ts.utctimetuple()
            t = time.mktime(tup)
            if t0 == None:
                t0 = t
            pt = {'pos': [lat, lon, alt], 'time': t, 'rt': t-t0}
            recs.append(pt)
            #print time.ctime(t)
        indexObj['recs'] = recs
        indexObj['startTime'] = t0
        indexObj['endTime'] = t
        indexObj['duration'] = t - t0
        return Track(**indexObj)

class TrackModelView(MyModelView):
    """ Track Model """
    can_upload = True
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


class TrackUploadView(FileAdmin):
    """ Track Upload Admin View """

    def __init__(self, *args, **kwargs):
        path = app.config['UPLOAD_PATH']
        super(TrackUploadView, self).__init__(path, *args, **kwargs)


    @flask_admin.expose('/', methods=('GET', 'POST'))
    def index_view(self, path=None):
        return super(TrackUploadView, self).upload(path=path)

    def get_upload_form(self):
        """
            Upload form class for file upload view.
            Override to implement customized behavior.
        """
        class UploadForm(self.form_base_class):
            """
                File upload form. Works with FileAdmin instance to check if it
                is allowed to upload file with given extension.
            """
            upload = fields.FileField(lazy_gettext('File to upload'))

            def __init__(self, *args, **kwargs):
                super(UploadForm, self).__init__(*args, **kwargs)
                self.admin = kwargs['admin']

        return UploadForm

    def save_file(self, path, file_data):
        super(TrackUploadView, self).save_file(path, file_data)
        self.parse(path)

    def parse(self, filename):
        if filename.endswith('.gpx'):
            self.parseGPX(filename)
        elif filename.endswith('.json'):
            self.parseJSON(filename)
        else:
            os.remove(filename)
            raise validators.ValidationError(gettext('Unsupported file type.'))

    def parseGPX(self, filename):
        try:
            track = Track.parseGPX(filename)
            if track:
                track.save()
            os.remove(filename)
        except Exception, e:
            os.remove(filename)
            raise e

    def parseJSON(self, filename):
        try:
            track = Track.parseJSON(filename)
            if track:
                track.save()
            os.remove(filename)
        except Exception, e:
            os.remove(filename)
            raise e

admin.add_view(TrackModelView(Track))
admin.add_view(TrackUploadView(name='Upload'))
