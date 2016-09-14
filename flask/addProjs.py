
import flask_worldviews
from flask_worldviews.Projects import Project

proj = Project(title="WorldViews Technology Development",
               description="""
This is to build cool server and client software for furthering
the WorldViews mission. All our software is open source, and
built on open source.  
""")
proj.save()


proj = Project(title="WorldViews Oganization and Community",
               description="""
This is to create and nurture a vibrant community of people
working on WorldViews, enjoying the project, or using it to
share views of the world.  
""")
proj.save()

proj = Project(title="Drone Views",
               description="""
Inspired by the sites travelbydrone.com and travelwithdrone.com
we would like to have a later that shows beautiful videos of drones
from all around the world. We would also like to show current live
drone videos, and to make a request to have videos shot at various
locations. We will also work to provide software so that drone
flights can be remotely controlled (within geobox and safetly
control guidlines) by remote people watching on WorldViews.  
""")
proj.save()

proj = Project(title="Guide and Expert Registry",
               description="""
This project will make it easy to find people around any location
who can tell you about that location, show you things, or even
provide views or tours of the area. This works by listing current
live streams or guides ready to stream using Periscope, Meerkat,
or other mobile streaming technologies. We also have a ShareCamApp
powered by the JumpCh.at WebRTC system that lets people take pictures
together. The Registry lists active guides, or guides willing to
provide views for upcoming events, and for others to list views
or event coverage they would like to see.  
""")
proj.save()

proj = Project(title="Scaling El Capitan",
               description="""
Enock Glidden is planning to ascend El Capitan at Yosemite this
September or October. WorldViews will find ways to support this
by providing views and tools for planning, and in helping people
interested in following Enock during his ascent.
""")
proj.save()

project_list = Project.objects.all()
print project_list

