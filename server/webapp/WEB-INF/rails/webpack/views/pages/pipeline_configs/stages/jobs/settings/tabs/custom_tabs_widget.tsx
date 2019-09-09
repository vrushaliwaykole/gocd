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

import {MithrilComponent} from "jsx/mithril-component";
import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {CustomTab} from "models/new_pipeline_configs/custom_tab";
import * as Buttons from "views/components/buttons";
import {Form, FormBody} from "views/components/forms/form";
import {HelpText, TextField} from "views/components/forms/input_fields";
import {Table} from "views/components/table";
import * as styles from "./custom_tabs_widget.scss";

interface Attrs {
  customTabs: CustomTab[];
}

export class CustomTabsWidget extends MithrilComponent<Attrs> {
  customTabsList: Stream<CustomTab[]> = Stream();

  oninit(vnode: m.Vnode<Attrs, this>) {
    this.customTabsList(vnode.attrs.customTabs);
  }

  view(vnode: m.Vnode<Attrs>) {
    return <div>
      <div class={styles.addCustomTabBtnContainer}>
        <Buttons.Secondary onclick={this.addCustomTab.bind(this, vnode)} small={true} icon={Buttons.ButtonIcon.ADD} data-test-id="job-settings-add-custom-tab">
          Add tab
        </Buttons.Secondary>
        <HelpText helpTextId="help-job-settings-custom-tabs"
                  helpText="Lets you add new tabs within the Job Details page."
                  docLink="faq/dev_see_artifact_as_tab.html"/>
      </div>
      <FormBody>
        <Form last={true} compactForm={true}>
          <Table headers={["name", "value", ""]} data={
            _.map(this.customTabsList(), (customTab) => {
              return [
                <TextField property={customTab.name} errorText={customTab.errors().errorsForDisplay("name")}/>,
                <TextField property={customTab.path} errorText={customTab.errors().errorsForDisplay("path")}/>,
                <Buttons.Cancel onclick={this.removeCustomTab.bind(this, customTab)} small={true} icon={Buttons.ButtonIcon.REMOVE} />
              ];
            })
          }/>
        </Form>
      </FormBody>
    </div>;
  }

  addCustomTab() {
    this.customTabsList().push(new CustomTab("", ""));
  }

  removeCustomTab(customTab: CustomTab) {
    const index = this.customTabsList().findIndex((record) => record === customTab);
    this.customTabsList().splice(index, 1);
  }
}
