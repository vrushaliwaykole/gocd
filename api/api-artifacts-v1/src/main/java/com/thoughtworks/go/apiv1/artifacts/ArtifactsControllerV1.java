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

package com.thoughtworks.go.apiv1.artifacts;

import com.thoughtworks.go.api.ApiController;
import com.thoughtworks.go.api.ApiVersion;
import com.thoughtworks.go.api.CrudController;
import com.thoughtworks.go.api.base.OutputWriter;
import com.thoughtworks.go.api.representers.JsonReader;
import com.thoughtworks.go.api.spring.ApiAuthenticationHelper;
import com.thoughtworks.go.api.util.GsonTransformer;
import com.thoughtworks.go.apiv1.artifacts.represernter.ArtifactConfigRepresenter;
import com.thoughtworks.go.config.ArtifactConfig;
import com.thoughtworks.go.config.ConfigTag;
import com.thoughtworks.go.config.exceptions.EntityType;
import com.thoughtworks.go.config.exceptions.GoConfigInvalidException;
import com.thoughtworks.go.config.update.UpdateArtifactConfigCommand;
import com.thoughtworks.go.i18n.LocalizedMessage;
import com.thoughtworks.go.server.service.EntityHashingService;
import com.thoughtworks.go.server.service.ServerConfigService;
import com.thoughtworks.go.server.service.result.HttpLocalizedOperationResult;
import com.thoughtworks.go.spark.Routes;
import com.thoughtworks.go.spark.spring.SparkSpringController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import spark.Request;
import spark.Response;

import java.io.IOException;
import java.util.function.Consumer;

import static com.thoughtworks.go.api.util.HaltApiResponses.haltBecauseEtagDoesNotMatch;
import static com.thoughtworks.go.i18n.LocalizedMessage.entityConfigValidationFailed;
import static com.thoughtworks.go.server.newsecurity.utils.SessionUtils.currentUsername;
import static spark.Spark.*;

@Component
public class ArtifactsControllerV1 extends ApiController implements SparkSpringController, CrudController<ArtifactConfig> {

    private final ApiAuthenticationHelper apiAuthenticationHelper;
    private ServerConfigService serverConfigService;
    private EntityHashingService entityHashingService;

    @Autowired
    public ArtifactsControllerV1(ApiAuthenticationHelper apiAuthenticationHelper, EntityHashingService entityHashingService, ServerConfigService serverConfigService) {
        super(ApiVersion.v1);
        this.apiAuthenticationHelper = apiAuthenticationHelper;
        this.serverConfigService = serverConfigService;
        this.entityHashingService = entityHashingService;
    }

    @Override
    public String controllerBasePath() {
        return Routes.Artifacts.BASE;
    }

    @Override
    public void setupRoutes() {
        path(controllerBasePath(), () -> {
            before("", mimeType, this::setContentType);
            before("/*", mimeType, this::setContentType);
            before("", mimeType, this.apiAuthenticationHelper::checkAdminUserAnd403);

            get("", mimeType, this::show);
            put("", mimeType, this::update);
        });
    }

    public String update(Request request, Response response) {
        ArtifactConfig modifiedArtifactConfig = buildEntityFromRequestBody(request);

        if (isPutRequestStale(request, serverConfigService.getArtifactsConfig())) {
            throw haltBecauseEtagDoesNotMatch();
        }

        HttpLocalizedOperationResult operationResult = new HttpLocalizedOperationResult();
        try {
            serverConfigService.updateArtifactConfig(modifiedArtifactConfig);
        } catch (Exception e) {
            if ((e instanceof GoConfigInvalidException) && !operationResult.hasMessage()) {
                operationResult.unprocessableEntity(entityConfigValidationFailed(modifiedArtifactConfig.getClass().getAnnotation(ConfigTag.class).value(), e.getMessage()));
            } else if (!operationResult.hasMessage()) {
                operationResult.badRequest(LocalizedMessage.composite("Failed to update artifact config.", e.getMessage()));
            }
        }

        return handleCreateOrUpdateResponse(request, response, modifiedArtifactConfig, operationResult);
    }

    public String show(Request request, Response response) throws IOException {
        ArtifactConfig artifactsConfig = serverConfigService.getArtifactsConfig();
        setEtagHeader(response, etagFor(artifactsConfig));
        return writerForTopLevelObject(request, response, jsonWriter(artifactsConfig));
    }


    public Consumer<OutputWriter> jsonWriter(ArtifactConfig artifactConfig) {
        return outputWriter -> ArtifactConfigRepresenter.toJSON(outputWriter, artifactConfig);
    }

    @Override
    public String etagFor(ArtifactConfig entityFromServer) {
        return entityHashingService.md5ForEntity(entityFromServer);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.ArtifactConfig;
    }

    @Override
    public ArtifactConfig buildEntityFromRequestBody(Request req) {
        JsonReader jsonReader = GsonTransformer.getInstance().jsonReaderFrom(req.body());
        return ArtifactConfigRepresenter.fromJSON(jsonReader);
    }
}
