/*
 * Copyright 2019 ThoughtWorks, Inc.
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

import m from "mithril";
import Stream from "mithril/stream";
import {MailServer} from "models/server-configuration/server_configuration";
import {MailServerManagementWidget} from "views/pages/server-configuration/mail_server_management_widget";
import {TestHelper} from "views/pages/spec/test_helper";
import {ApiResult} from "../../../../helpers/api_request_builder";
import {MailServerCrud} from "../../../../models/server-configuration/server_configuartion_crud";

describe("MailServerManagementWidget", () => {
  const helper              = new TestHelper();
  const onDeleteSpy         = jasmine.createSpy("onDelete");
  const onSuccessfulSaveSpy = jasmine.createSpy("onSuccessfulSave");
  const onErrorSpy          = jasmine.createSpy("onError");

  afterEach(helper.unmount.bind(helper));

  it("should show form", () => {
    mount(new MailServer());

    expect(helper.byTestId("form-field-input-smtp-hostname")).toBeInDOM();
    expect(helper.byTestId("form-field-input-smtp-port")).toBeInDOM();
    expect(helper.byTestId("form-field-input-use-smtps")).toBeInDOM();
    expect(helper.byTestId("form-field-input-smtp-username")).toBeInDOM();
    expect(helper.byTestId("form-field-input-smtp-password")).toBeInDOM();
    expect(helper.byTestId("form-field-input-send-email-using-address")).toBeInDOM();
    expect(helper.byTestId("form-field-input-administrator-email")).toBeInDOM();
  });

  it("should show cancel and save buttons", () => {
    mount(new MailServer());

    expect(helper.byTestId("cancel")).toBeInDOM();
    expect(helper.byTestId("save")).toBeInDOM();
    expect(helper.byTestId("cancel")).toHaveText("Cancel");
    expect(helper.byTestId("save")).toHaveText("Save");
  });

  it("should reset field values on click of cancel", () => {
    mount(new MailServer("hostname", 1234, "bob", "password", undefined, true, "sender@foo.com", "admin@foo.com"));

    helper.oninput(helper.byTestId("form-field-input-smtp-hostname"), "some-hostname");
    helper.oninput(helper.byTestId("form-field-input-smtp-port"), "3000");
    helper.oninput(helper.byTestId("form-field-input-smtp-username"), "another_user");
    helper.oninput(helper.byTestId("form-field-input-smtp-password"), "some-password");
    helper.clickByTestId("form-field-input-use-smtps");
    helper.oninput(helper.byTestId("form-field-input-send-email-using-address"), "some-email");
    helper.oninput(helper.byTestId("form-field-input-administrator-email"), "another_admin@foo.com");

    helper.clickByTestId("cancel");

    expect(helper.byTestId("form-field-input-smtp-hostname")).toHaveValue("hostname");
    expect(helper.byTestId("form-field-input-smtp-port")).toHaveValue("1234");
    expect(helper.byTestId("form-field-input-smtp-username")).toHaveValue("bob");
    expect(helper.byTestId("form-field-input-smtp-password")).toHaveValue("password");
    expect(helper.byTestId("form-field-input-use-smtps")).toBeChecked();
    expect(helper.byTestId("form-field-input-send-email-using-address")).toHaveValue("sender@foo.com");
    expect(helper.byTestId("form-field-input-administrator-email")).toHaveValue("admin@foo.com");

  });

  it("should call `onSuccessfulSave` on saving valid mail server configuration", (done) => {
    const mailServer = new MailServer("hostname", 1234, "bob", "password", undefined, true, "sender@foo.com", "admin@foo.com");

    const promise = new Promise<ApiResult<MailServer>>((resolve) => {
      const apiResult = ApiResult.success("", 200, new Map()).map(() => mailServer);
      resolve(apiResult);
      setTimeout(() => {
        expect(onSuccessfulSaveSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    spyOn(MailServerCrud, "createOrUpdate").and.callFake(() => {
      return promise;
    });

    mount(mailServer, true);
    helper.clickByTestId("save");
  });

  it("should call onDelete", () => {
    mount(new MailServer());
    helper.oninput(helper.byTestId("form-field-input-smtp-hostname"), "foobar");
    helper.clickByTestId("Delete");
    expect(helper.byTestId("Delete")).not.toBeDisabled();
    expect(onDeleteSpy).toHaveBeenCalled();
  });

  it("should disable onDelete", () => {
    mount(new MailServer(), false);
    expect(helper.byTestId("Delete")).toBeDisabled();
  });

  function mount(mailServer: MailServer, canDeleteMailServer: boolean = true) {
    helper.mount(() => <MailServerManagementWidget mailServer={Stream(mailServer)}
                                                   onSuccessfulSave={onSuccessfulSaveSpy}
                                                   onError={onErrorSpy}
                                                   canDeleteMailServer={Stream(canDeleteMailServer)}
                                                   onMailServerManagementDelete={onDeleteSpy}/>);
  }
});
