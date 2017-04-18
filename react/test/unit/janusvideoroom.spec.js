// var assert = require('chai').assert;
// var sinon = require('sinon');
// var Promise = require('bluebird');
// var JanusVideoRoom = require('../../src/lib/janusvideoroom').default;

import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import JanusVideoRoom from '../../src/lib/janusvideoroom';

describe('JanusVideoRoom Unit Tests', () => {

    var client;

    it('constructor', () => {
        client = new JanusVideoRoom();
        assert.notEqual(client.options, undefined);
    });
});
