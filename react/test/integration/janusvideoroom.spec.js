import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import JanusVideoRoom from '../../src/lib/janusvideoroom';

describe('JanusVideoRoom Integartion Tests', () => {

    var client = new JanusVideoRoom({
        //url: 'ws://localhost:8188/janus'
        url: 'wss://sd6.dcpfs.net:8989/janus'
        // url: 'http://localhost:8088/janus'
    });

    it('connect', (done) => {
        client.connect().then(() => {
            assert.ok(true, "connect ok");
            done();
        }).error(() => {
            assert.ok(false, "connect failed");
            done();
        });
    }).timeout(3000);

    it('list rooms', (done) => {
        client.listRooms().then((rooms) => {
            assert.isAtLeast(rooms.length, 1);
            done();
        });
    });

    it('room exists', (done) => {
        client.roomExists(1234).then((exists) => {
            assert.isOk(exists);
            return client.roomExists(9999)
        }).then((exists) => {
            assert.isNotOk(exists);
            done();
        });
    });

    it('list users', (done) => {
        client.listUsers(1234).then((users) => {
            assert.isAtLeast(users.length, 0);
            done();
        });
    });

    it('join room', (done)  => {
        client.join(1234).then((roomInfo) => {
            assert.equal(roomInfo.room, 1234);
            done();
        });
    });

    it('publish room', (done) => {
        let constraints = {
            video: true,
            audio: true
        }
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            assert.notEqual(stream, undefined);
            client.publish(stream).then(() => {
                done();
            });
        });
    });

    it('subscribe room', (done) => {
        let timeout = setTimeout(() => {
            client.off('remotestream', onremotestream);
            asset.ok(false, "didn't get a remote stream");
        }, 7000);

        let onremotestream = (stream) => {
            client.off('remotestream', onremotestream);
            assert.isNotNull(stream);
            clearTimeout(timeout)
            done();
        };

        client.on('remotestream', onremotestream);

        client.listUsers(1234).then((users) => {
            let id = users[0].id;
            client.subscribe(1234, id).then(() => {
            });
        });
    }).timeout(10000);

    it('unpublish room', (done) => {
        client.unpublish().then(() => {
            done();
        });
    });

    it('leave room', (done)  => {
        client.leave(1234).then(() => {
            done();
        });
    });

    it('disconnect', (done) => {
        client.disconnect().then(() => {
            assert.ok(true, "disconnect ok");
            done();
        }).error(() => {
            assert.ok(false, "disconnect failed");
            done();
        });
    });

});
