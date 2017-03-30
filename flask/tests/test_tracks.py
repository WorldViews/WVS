""" Tracks Unittest """
import unittest
import flask_worldviews
from mongoengine import connect
from flask_mongoengine import MongoEngine
from flask_worldviews.models.tracks import Track

class TracksTestCase(unittest.TestCase):

    def setUp(self):
        flask_worldviews.app.config['MONGODB_SETTINGS'] = {'db': 'wv_data_test'}
        flask_worldviews.app.config['TESTING'] = True
        flask_worldviews.db.disconnect()
        flask_worldviews.db = MongoEngine()
        flask_worldviews.db.init_app(flask_worldviews.app)
        self.app = flask_worldviews.app.test_client()

    def tearDown(self):
        pass
        # db = connect('wv_data_test')
        # db.drop_database('wv_data_test')

    def test_track(self):
        t = Track()
        t.save()
        tracks = Track.objects.all()
        self.assertNotEqual(len(tracks), 0)


if __name__ == '__main__':
    unittest.main()
