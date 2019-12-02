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

import Stream from "mithril/stream";
import {ArtifactConfig, DefaultJobTimeout, MailServer, SiteUrls} from "./server_configuration";

type ServerConfigType = ArtifactConfig | MailServer | SiteUrls | DefaultJobTimeout;

class BaseVM<T extends ServerConfigType> {
  etag: Stream<string | undefined>;
  protected readonly original: Stream<ServerConfigType>;
  protected readonly modified: Stream<ServerConfigType>;

  constructor() {
    this.etag     = Stream();
    this.original = Stream();
    this.modified = Stream();
  }

  reset() {
    this.modified(this.original().clone());
  }

  sync(object: ServerConfigType, etag?: string) {
    this.original(object);
    this.modified(object.clone());
    this.etag(etag);
  }
}

export class ArtifactConfigVM extends BaseVM<ArtifactConfig> {

  constructor() {
    super();
    this.original(new ArtifactConfig(""));
    this.modified(new ArtifactConfig(""));
  }

  artifactConfig(): ArtifactConfig {
    return this.modified() as ArtifactConfig;
  }
}

export class SiteUrlsVM extends BaseVM<SiteUrls> {
  constructor() {
    super();
    this.original(new SiteUrls("", ""));
    this.modified(new SiteUrls("", ""));
  }

  siteUrls(): SiteUrls {
    return this.modified() as SiteUrls;
  }
}

export class DefaultJobTimeoutVM extends BaseVM<DefaultJobTimeout> {
  constructor() {
    super();
    this.original(new DefaultJobTimeout(0));
    this.modified(new DefaultJobTimeout(0));
  }

  jobTimeout(): DefaultJobTimeout {
    return this.modified() as DefaultJobTimeout;
  }
}

export class MailServerVM extends BaseVM<MailServer> {
  canDeleteMailServer: Stream<boolean>;

  constructor() {
    super();
    this.original(new MailServer());
    this.modified(new MailServer());
    const flag: (val?: boolean) => Stream<boolean> = Stream;
    this.canDeleteMailServer                       = flag(false);
  }

  mailServer(mailServer?: MailServer): MailServer {
    if (mailServer) {
      this.modified(mailServer);
    }
    return this.modified() as MailServer;
  }
}
