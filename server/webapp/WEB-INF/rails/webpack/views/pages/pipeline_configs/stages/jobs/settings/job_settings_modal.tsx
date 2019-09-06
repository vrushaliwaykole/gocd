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
import {Modal} from "views/components/modal";
import {Tabs} from "views/components/tab";
import {CustomTabsWidget} from "./tabs/custom_tabs";

export class JobSettingsModal extends Modal {
  constructor() {
    super();
  }

  body(): m.Children {
    const customTabs = <CustomTabsWidget/>;

    return <div data-test-id="job-settings-modal">
      <Tabs tabs={["Custom tabs"]} contents={[customTabs]}/>
    </div>;
  }

  title(): string {
    return "Job Settings";
  }
}
