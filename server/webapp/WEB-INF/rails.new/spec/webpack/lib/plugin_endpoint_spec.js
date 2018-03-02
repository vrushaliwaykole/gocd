/*
 * Copyright 2018 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 describe("PluginEndpoint", () => {

  const PluginEndpoint = require('rails-shared/plugin-endpoint');
  const origPostMessage = window.postMessage;
  const origListener = window.addEventListener;

  let dispatch;

  function mockEvent(message) {
    const event = {};
    event.source = window;
    event.origin = "null";
    event.data = message;
    return event;
  }

  beforeEach(() => {
    window.addEventListener = function(name, fn, bool) {
      if ("message" === name) {
        dispatch = fn;
      } else {
        origListener(name, fn, bool);
      }
    };

    Object.defineProperty(window, "postMessage", {
      value: function(message, _origin) {
        dispatch(mockEvent(message));
      }
    });

    PluginEndpoint.ensure();
  });

  afterEach(() => {
    window.postMessage = origPostMessage;
    window.addEventListener = origListener;
  });

  it("should send response for matching request", (done) => {
    let messageContent;
    let response;

    PluginEndpoint.define({
      "should.receive": (message, trans) => {
        messageContent = message.body;
        trans.respond({ data: "correct" });
      },
      "should.not.receive": (_message, trans) => {
        trans.respond({ data: "incorrect" });
      }
    });

    PluginEndpoint.onInit((_data, trans) => {
      trans.request("should.receive", "foo").done((data) => {
        response = data;
      }).fail((_error) => {
        fail(); // eslint-disable-line no-undef
      }).always(() => {
        expect(response).toBe("correct");
        expect(messageContent).toBe("foo");
        done();
      });
    });

    PluginEndpoint.init(window, "initialized");
  });
});
