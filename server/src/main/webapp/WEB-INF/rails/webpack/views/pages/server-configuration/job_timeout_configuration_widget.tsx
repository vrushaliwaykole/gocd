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

import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import Stream from "mithril/stream";
import {ButtonGroup, Cancel, Primary} from "views/components/buttons";
import {Form, FormBody} from "views/components/forms/form";
import {CheckboxField, NumberField} from "views/components/forms/input_fields";
import {OperationState} from "views/pages/page_operations";
import styles from "views/pages/server-configuration/index.scss";
import {JobTimeoutAttrs} from "views/pages/server_configuration";
import {JobTimeoutManagementCRUD} from "../../../models/server-configuration/server_configuartion_crud";
import {DefaultJobTimeout} from "../../../models/server-configuration/server_configuration";

export class JobTimeoutConfigurationWidget extends MithrilViewComponent<JobTimeoutAttrs> {
  private ajaxOperationMonitor = Stream<OperationState>(OperationState.UNKNOWN);
  private __jobTimeout         = Stream<DefaultJobTimeout>();

  oninit(vnode: m.Vnode<JobTimeoutAttrs>) {
    this.__jobTimeout = Stream(vnode.attrs.defaultJobTimeout().clone());
  }

  view(vnode: m.Vnode<JobTimeoutAttrs>): m.Vnode {
    return <div data-test-id="job-timeout-management-widget" class={styles.formContainer}>
      <FormBody>
        <div class={styles.formHeader}>
          <h2>Configure your default Job Timeout</h2>
        </div>
        <div class={styles.formFields}>
          <Form compactForm={true}>
            <CheckboxField dataTestId="checkbox-for-job-timeout"
                           property={this.__jobTimeout().neverTimeout}
                           label={"Never job timeout"}
                           onchange={() => this.__jobTimeout().defaultJobTimeout(0)}/>
            <NumberField label="Default Job timeout"
                         helpText="the job will get cancel after the given minutes of inactivity"
                         readonly={this.__jobTimeout().neverTimeout()}
                         property={this.__jobTimeout().defaultJobTimeout}
                         required={true}
                         errorText={this.__jobTimeout().errors().errorsForDisplay("defaultJobTimeout")}/>
          </Form>
        </div>
        <div class={styles.buttons}>
          <ButtonGroup>
            <Cancel data-test-id={"cancel"}
                    ajaxOperationMonitor={this.ajaxOperationMonitor}
                    onclick={() => this.__jobTimeout(vnode.attrs.defaultJobTimeout().clone())}>Cancel</Cancel>
            <Primary data-test-id={"save"}
                     ajaxOperation={() => this.save(vnode)}
                     ajaxOperationMonitor={this.ajaxOperationMonitor}
                     onclick={() => this.save(vnode)}>Save</Primary>
          </ButtonGroup>
        </div>
      </FormBody>
    </div>;
  }

  save(vnode: m.Vnode<JobTimeoutAttrs>) {
    if (this.__jobTimeout().isValid()) {
      return JobTimeoutManagementCRUD.createOrUpdate(this.__jobTimeout()).then((result) => {
        result.do((() => {
          vnode.attrs.onSuccessfulSave("Job timeout configuration saved successfully!");
        }), (errorResponse) => {
          vnode.attrs.onError(JSON.parse(errorResponse.body!).message);
        });
      });
    }
    return Promise.resolve();
  }
}
