# -*- coding: utf-8 -*-
from Registry.models import Tag, Project
from django.contrib import admin

class TagAdmin(admin.ModelAdmin):
      list_display    = ['text']

class ProjectAdmin(admin.ModelAdmin):
#      list_display    = ['name', 'title', 'description', 'members', 'followers']
      list_display    = ['name', 'title', 'description']

admin.site.register(Tag, TagAdmin)
admin.site.register(Project, ProjectAdmin)
