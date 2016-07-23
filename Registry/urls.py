from django.conf.urls import patterns, include, url
from django.contrib import admin

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'Registry.views.index', name='index'),
    url(r'^about/', 'Registry.views.about', name='about'),
    url(r'^projects/', 'Registry.views.projects', name='projects'),
    url(r'^members/', 'Registry.views.members', name='members'),
    url(r'^inspirations/', 'Registry.views.inspirations', name='inspirations'),
    url(r'^addproj/', 'Registry.views.addproj', name='addproj'),
    url(r'^joinproj/', 'Registry.views.joinproj', name='joinproj'),
    url(r'^followproj/', 'Registry.views.followproj', name='followproj'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^reg_query/$', 'Registry.views.reg_query', name='reg_query'),
    url(r'^reg_connect/$', 'Registry.views.reg_connect'),
    url(r'^reg_remove/$', 'Registry.views.reg_remove'),
    url(r'^reg/$', 'Registry.views.reg'),
    url(r'^regp/$', 'Registry.views.regp'),
    url(r'^reg_config/$', 'Registry.views.reg_config'),
    url(r'^reg_becomeguide/$', 'Registry.views.reg_becomeguide'),
    url(r'^reg_notification/$', 'Registry.views.reg_notification'),
    #
    url(r'^requestform/$', 'Registry.views.requestform'),
    url(r'^reg_addrequest/$', 'Registry.views.reg_addrequest'),
    url(r'^reg_getrequests/$', 'Registry.views.reg_getrequests', name='get_requests'),
    url(r'^reg_getguides/$', 'Registry.views.reg_getguides', name='get_guides'),
    url(r'^reg_addguide/$', 'Registry.views.reg_addguide', name='add_guide'),
    url(r'^reg_getsessions/$', 'Registry.views.reg_getsessions', name='get_sessions'),
    url(r'^reg_addsession/$', 'Registry.views.reg_addsession', name='add_session'),
    #
    url(r'^reg_setNotification/$', 'Registry.views.reg_setNotification'),
    url(r'^reg_getNotification/$', 'Registry.views.reg_getNotification'),
    url(r'^reg_delNotification/$', 'Registry.views.reg_delNotification'),
    url(r'^mapview/$', 'Registry.views.mapview', name='mapview'),
    url(r'^globeview/$', 'Registry.views.globeview', name='globeview'),

    url(r'^admin/', include(admin.site.urls)),

    url('', include('social.apps.django_app.urls', namespace='social')),
    url(r'^login/$', 'Registry.views.login', name='login'),
    url(r'^logout/$', 'Registry.views.logout', name='logout'),

) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
