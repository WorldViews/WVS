"""

An Event should be a dictionary with at least a field called eventType

    eventType

"""
import socket, jsonHack

class NotificationRequest:
    def __init__(self, pattern, method, email, **kwargs):
        self.email = email
        self.pattern = pattern
        self.method = method
        self.kwargs = kwargs

class Notifier():
    def __init__(self, dba, msgClass=None, mailer=None):
        self.dba = dba
        self.msgClass = msgClass
        self.mailer = mailer

    def reset(self):
        """
        Delete all requests
        """
        self.dba.db.drop_collection('notification_requests')

    def deleteRequests(self, pattern={}):
        print "deleteRequests", pattern
        self.dba.db.notification_requests.delete_many(pattern)

    def addRequest(self, req):
        print "Add request", req
        self.dba.db.notification_requests.insert_one(req)

    def getNotificationRequests(self, **args):
        reqs = self.dba.db.notification_requests.find(args)
        reqs = [req for req in reqs]
        return reqs

    def noticeNewUser(self, obj):
        print "************* new user obj **********"
        event = {'eventType': 'newUser', 
                 'obj': obj}
        self.handleMatchingNotifications(event)

    def noticeNewChatPost(self, msg):
        print "************* new msg **********"
        event = {'eventType': 'newChatPost',
                 'msg': msg}
        self.handleMatchingNotifications(event)

    def noticeNewNote(self, note):
        print "************* new user note **********"
        event = {'eventType': 'newNote',
                 'note': note}
        self.handleMatchingNotifications(event)

    def noticeNewComment(self, note, comment):
        print "************* new user obj **********"
        event = {'eventType': 'newComment',
                 'note': note,
                 'comment': comment}
        self.handleMatchingNotifications(event)

    def handleMatchingNotifications(self, event):
        print "handleMatchingNotifications", event
        requests = self.dba.db.notification_requests.find()
        for request in requests:
            #print "checking request:", request
            req = NotificationRequest(**request)
            #print "req:", req
            if self.matches(req, event):
                self.handleNotification(req, event)
    
    def matches(self, req, event):
        for key in req.pattern.keys():
            if req.pattern[key] != event[key]:
                return False
        return True

    def handleNotification(self, req, event):
        print "=============="
        print "Now we should notify user", req.email
        print " about event", event
        print "-------"
        if req.method == 'email':
            self.sendEmail(req, event)
        elif req.method == 'SMS':
            self.sendSMS(req, event)
        else:
            print "Unknown method type"

    def sendEmail(self, req, event):
        msg = "This kind of event has happened\n"
        msg += str(event)
        print "sending email to user", req.email
        print "msg:", msg
        host = socket.gethostname()
        agent = "WVServer "+host
        if self.msgClass and self.mailer:
            subject = "Hello"
            emsg = self.msgClass(subject,
                                 sender=[agent, "wviewsmail@gmail.com"],
                                 recipients=[req.email])
            buf = jsonHack.dumps(event, indent=4)
            buf += "\nhost "+host
            emsg.body = buf
            self.mailer.send(emsg)

    def sendSMS(self, req, event):
        msg = "This kind of event has happened\n"
        msg += str(event)
        print "sending SMS to user", req.email
        print "msg:", msg

#------------------------------------------------------------
# Testing stuff...

def test():
    import MDBA
    import flaskAuthServer80 as WVS

    dba = MDBA.MDBAdapter()
    ntfr = Notifier(dba)
    ntfr.reset()
    """
    ntfr.addRequest(
        {'email': 'donkimber@gmail.com',
         'pattern': {'eventType': 'newUser'},
         'method': 'email'})
    """

    ntfr.addRequest(
        {'email': 'donkimber@gmail.com',
         'pattern': {'eventType': 'newChatPost'},
         'method': 'email'})

    ntfr.addRequest(
        {'email': 'donkimber@gmail.com',
         'pattern': {'eventType': 'newComment'},
         'method': 'email'})

    ntfr.addRequest(
        {'email': 'doczeno@yahoo.com',
         'pattern': {'eventType': 'newNote'},
         'method': 'SMS'})

    ntfr.noticeNewUser({'userid': 'johnny'})
    ntfr.noticeNewNote({'type': 'note', 'text': 'some text'})
    ntfr.noticeNewComment({'type': 'note', 'text': 'some text'}, "comment")

if __name__ == '__main__':
    test()
