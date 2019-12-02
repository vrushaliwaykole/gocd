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

import {JsonUtils} from "helpers/json_utils";
import m from "mithril";
import Stream from "mithril/stream";
import {ArtifactConfigCRUD, JobTimeoutManagementCRUD, MailServerCrud, ServerManagementCRUD} from "models/server-configuration/server_configuartion_crud";
import {ArtifactConfig, DefaultJobTimeout, MailServer, SiteUrls} from "models/server-configuration/server_configuration";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {DeleteConfirmModal} from "views/components/modal/delete_confirm_modal";
import {Page, PageState} from "views/pages/page";
import {Sections, ServerConfigurationWidget} from "views/pages/server-configuration/server_configuration_widget";
import {ArtifactConfigVM, DefaultJobTimeoutVM, MailServerVM, SiteUrlsVM} from "../../models/server-configuration/server_configuration_vm";

export interface ServerManagementAttrs {
  onServerManagementSave: () => Promise<SiteUrls | void>;
  siteUrlsVM: Stream<SiteUrlsVM>;
}

export interface JobTimeoutAttrs {
  onDefaultJobTimeoutSave: (jobTimeout: DefaultJobTimeout) => Promise<any>;
  defaultJobTimeoutVM: Stream<DefaultJobTimeoutVM>;
}

export interface ArtifactManagementAttrs {
  artifactConfigVM: Stream<ArtifactConfigVM>;
  onArtifactConfigSave: (artifactConfig: ArtifactConfig, etag: string | undefined) => Promise<ArtifactConfig | void>;
}

export interface MailServerManagementAttrs {
  mailServerVM: Stream<MailServerVM>;
  onMailServerManagementDelete: () => void;
  onMailServerManagementSave: (mailServer: MailServer) => Promise<void | MailServer>;
}

export interface Routing {
  activeConfiguration: Sections;
  route: (activeConfiguration: Sections) => void;
}

interface State extends ServerManagementAttrs, ArtifactManagementAttrs, MailServerManagementAttrs, JobTimeoutAttrs, Routing {
}

export class ServerConfigurationPage extends Page<null, State> {
  oninit(vnode: m.Vnode<null, State>) {
    vnode.state.activeConfiguration = m.route.param().configuration || Sections.SERVER_MANAGEMENT;

    super.oninit(vnode);

    vnode.state.route               = (activeConfiguration: Sections) => {
      vnode.state.activeConfiguration = activeConfiguration;
      m.route.set(activeConfiguration);
      this.fetchData(vnode);
    };
    vnode.state.siteUrlsVM          = Stream(new SiteUrlsVM());
    vnode.state.artifactConfigVM    = Stream(new ArtifactConfigVM());
    vnode.state.mailServerVM        = Stream(new MailServerVM());
    vnode.state.defaultJobTimeoutVM = Stream(new DefaultJobTimeoutVM());

    vnode.state.onServerManagementSave = () => {
      if (vnode.state.siteUrlsVM().siteUrls().isValid()) {
        return ServerManagementCRUD.put(vnode.state.siteUrlsVM().siteUrls(), vnode.state.siteUrlsVM().etag()).then((result) => {
          result.do((successResponse) => {
            this.flashMessage.setMessage(MessageType.success, "Site urls updated successfully");
            this.fetchData(vnode);
          }, (errorResponse) => {
            this.flashMessage.setMessage(MessageType.alert, JSON.parse(errorResponse.body!).message);
          });
        });
      }
      return Promise.resolve();
    };

    vnode.state.onArtifactConfigSave = (artifactConfig: ArtifactConfig, etag: string | undefined) => {
      if (artifactConfig.isValid()) {
        return ArtifactConfigCRUD.put(artifactConfig, etag).then((result) => {
          result.do((successResponse) => {
            this.flashMessage.setMessage(MessageType.success, "Artifact config updated successfully");
            this.fetchData(vnode);
          }, (errorResponse) => {
            this.flashMessage.setMessage(MessageType.alert, JSON.parse(errorResponse.body!).message);
          });
        });
      }
      return Promise.resolve(artifactConfig);
    };

    vnode.state.onMailServerManagementSave = (mailServer: MailServer) => {
      return MailServerCrud.createOrUpdate(mailServer).then((result) => {
        result.do(
          (successResponse) => {
            const msg = "Configuration was saved successfully!";
            this.flashMessage.setMessage(MessageType.success, msg);
            this.fetchData(vnode);
          },
          (errorResponse) => {
            if (result.getStatusCode() === 422 && errorResponse.body) {
              vnode.state.mailServerVM().mailServer(MailServer.fromJSON(JsonUtils.toCamelCasedObject(JSON.parse(errorResponse.body)).data));
            } else {
              this.flashMessage.setMessage(MessageType.alert, JSON.parse(errorResponse.body!).message);
            }
          });
      });
    };

    vnode.state.onMailServerManagementDelete = () => {
      const message = <span>Are you sure you want to delete the mail server configuration?</span>;

      const modal: DeleteConfirmModal = new DeleteConfirmModal(message, () => {
        return MailServerCrud.delete()
                             .then((result) => {
                               result.do(
                                 (successResponse) => {
                                   const msg = "Configuration was deleted successfully!";
                                   this.flashMessage.setMessage(MessageType.success, msg);
                                   this.fetchData(vnode);
                                 },
                                 (errorResponse) => {
                                   if (result.getStatusCode() === 422 && errorResponse.body) {
                                     vnode.state.mailServerVM().sync(MailServer.fromJSON(JsonUtils.toCamelCasedObject(JSON.parse(errorResponse.body)).data));
                                   } else {
                                     this.flashMessage.setMessage(MessageType.alert, JSON.parse(errorResponse.body!).message);
                                   }
                                 });
                             })
                             .finally(modal.close.bind(modal));
      });
      modal.render();
    };

    vnode.state.onDefaultJobTimeoutSave = (jobTimeout: DefaultJobTimeout) => {
      if (jobTimeout.isValid()) {
        return JobTimeoutManagementCRUD.createOrUpdate(jobTimeout).then((result) => {
          result.do(((successResponse) => {
            const msg = "Configuration was saved successfully!";
            this.flashMessage.setMessage(MessageType.success, msg);
            this.fetchData(vnode);
          }), (errorResponse) => {
            this.flashMessage.setMessage(MessageType.alert, JSON.parse(errorResponse.body!).message);
          });
        });
      }
      return Promise.resolve();
    };
  }

  componentToDisplay(vnode: m.Vnode<null, State>): m.Children {
    const flashMessage = this.flashMessage.hasMessage() ?
      <FlashMessage type={this.flashMessage.type} message={this.flashMessage.message}/>
      : null;
    return [
      flashMessage,
      <ServerConfigurationWidget {...vnode.state}/>
    ];
  }

  pageName(): string {
    return "Server Configuration";
  }

  fetchData(vnode: m.Vnode<null, State>): Promise<any> {
    switch (vnode.state.activeConfiguration) {
      case Sections.SERVER_MANAGEMENT:
        return Promise.resolve(ServerManagementCRUD.get())
                      .then((results) => {
                        results.do((successResponse) => {
                          this.pageState = PageState.OK;
                          vnode.state.siteUrlsVM().sync(successResponse.body.object, successResponse.body.etag);
                        }, () => this.setErrorState());
                      });
      case Sections.ARTIFACT_MANAGEMENT:
        return Promise.resolve(ArtifactConfigCRUD.get())
                      .then((results) => {
                        results.do((successResponse) => {
                          this.pageState = PageState.OK;
                          vnode.state.artifactConfigVM().sync(successResponse.body.object, successResponse.body.etag);
                        }, () => this.setErrorState());
                      });
      case Sections.EMAIL_SERVER:
        return Promise.resolve(MailServerCrud.get())
                      .then((results) => {
                        if (results.getStatusCode() === 404) {
                          vnode.state.mailServerVM().sync(new MailServer());
                          vnode.state.mailServerVM().canDeleteMailServer(false);
                        } else {
                          results.do((successResponse) => {
                            vnode.state.mailServerVM().sync(successResponse.body);
                            vnode.state.mailServerVM().canDeleteMailServer(true);
                          }, () => this.setErrorState());
                        }
                      });
      case Sections.DEFAULT_JOB_TIMEOUT:
        return Promise.resolve(JobTimeoutManagementCRUD.get())
                      .then((results) => {
                        results.do((successResponse) => {
                          this.pageState = PageState.OK;
                          vnode.state.defaultJobTimeoutVM().sync(successResponse.body);
                        }, () => this.setErrorState());
                      });
    }
  }
}
