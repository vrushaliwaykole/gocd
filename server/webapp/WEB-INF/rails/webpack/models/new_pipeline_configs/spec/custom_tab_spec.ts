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

import {CustomTab} from "models/new_pipeline_configs/custom_tab";

describe("CustomTabs model", () => {
  it("should validate presence of name", () => {
    const customTab = new CustomTab("Foo", "bar");

    expect(customTab.isValid()).toBe(true);

    customTab.name("");

    expect(customTab.isValid()).toBe(false);
    expect(customTab.errors().errors("name")).toContain("Name is required");
  });

  it("should validate presence of path", () => {
    const customTab = new CustomTab("Foo", "bar");

    expect(customTab.isValid()).toBe(true);

    customTab.path("");

    expect(customTab.isValid()).toBe(false);
    expect(customTab.errors().errors("path")).toContain("Path is required");
  });
});
