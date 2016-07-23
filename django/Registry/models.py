from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Tag(models.Model):
    text = models.CharField(max_length=100, primary_key=True)

    def __str__(self):
        return "Tag #%s" % (self.text)

class Request(models.Model):
    #name = models.CharField(max_length=200, null=True, blank=True)
    text = models.CharField(max_length=500, null=True, blank=True)
    user = models.ForeignKey(User)
    request_time = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # tags
    tags = models.ManyToManyField(Tag)

    def getDict(self):
        return {'id': self.id, 'text': self.text, 'user': self.user.username,
#               'request_time': 'a time long ago',
               'request_time': "%s" % self.request_time,
                'latitude': self.latitude, 'longitude': self.longitude}

    def __unicode__(self):
        return "Request #%s" % (self.text)

class Guide(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    user = models.ForeignKey(User, null=True)
    text = models.CharField(max_length=500, null=True, blank=True)
    tags = models.ManyToManyField(Tag)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def getDict(self):
        obj = {'name': self.name, 'text': self.text,
               'latitude': self.latitude, 'longitude': self.longitude}
        if self.user:
            obj['user'] = self.user.username,
        return obj

class Session(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    text = models.CharField(max_length=500, null=True, blank=True)
    tags = models.ManyToManyField(Tag)
    guide = models.ForeignKey(Guide)
    num_followers = models.IntegerField(default=0)
    start_time = models.FloatField()
    heartbeat_time = models.FloatField()

class Project(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(User, related_name='projmembers')
    followers = models.ManyToManyField(User, related_name='projfollowers')

    # tags
    tags = models.ManyToManyField(Tag)

    def getDict(self):
        return {'id': self.id, 'title': self.title, 'description': self.description}

    def __unicode__(self):
        return "Project #%s" % (self.name)

