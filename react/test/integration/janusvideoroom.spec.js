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
        });
    }).timeout(3000);

    it('list rooms', (done) => {
        client.listRooms().then((rooms) => {
            assert.isAtLeast(rooms.length, 1);
        });
    });

    it('list users', (done) => {
        client.listUsers(1234).then((users) => {
            assert.isAtLeast(users.length, 0);
            done();
        });
    });

    it('disconnect', (done) => {
        client.disconnect().then(() => {
            assert.ok(true, "disconnect ok");
            done();
        }).error(() => {
            assert.ok(false, "disconnect failed");
        });
    });

});
