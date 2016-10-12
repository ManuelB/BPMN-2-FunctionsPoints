sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/json/JSONListBinding",
    "sap/ui/model/Filter",
    "sap/ui/model/ChangeReason",
    "sap/m/MessageToast",
    "jquery.sap.global"
], function(Controller, JSONModel, JSONListBinding, Filter, ChangeReason, MessageToast, jQuery) {
    "use strict";
    return Controller.extend("bpmn2fpa.controller.ProcessDetails", {
        onInit: function() {
            var me = this;
            var component = this.getOwnerComponent();
            if (component) {
                var router = component.getRouter();
                if (router) {
                    router.attachRoutePatternMatched(function(oEvent) {
                        if (oEvent.getParameter("name") == "Process") {
                            var fileName = oEvent.getParameter("arguments").fileName;
                            me.analyzeProcessFile(sap.ui.getCore().getModel().getFileByName(fileName));
                        }
                    });
                }
            }
            this._oProcessModel = new JSONModel({ "userTasks": [], "dataStores": [] }, true);
            this._oProcessModel.bindTree("/").attachChange(function() {
                // When anything changes
                var binding = me.byId("functionPointSum").getBinding("text");
                if (binding) {
                    binding.refresh(true);
                }
            });
            this.getView().setModel(this._oProcessModel, "Process");

        },
        onNavButtonPress: function() {
            this.getOwnerComponent().getRouter().navTo("Home");
        },
        /**
         * This function takes a file and reads it as 
         * a string, afterwards the result is passed to
         * analyzeProcessDocumentString,
         * @param {File} file
         */
        analyzeProcessFile: function(file) {
            if (!file) {
                return;
            }
            var me = this;
            var fileReader = new FileReader();
            fileReader.onload = function(event) {
                me.analyzeProcessDocumentString(event.target.result);
            };
            fileReader.readAsText(file);
        },
        /**
         * This function loads a BPMN model from the
         * URL as AJAX. This can be used for testing
         * purposes.
         * @param {string} url
         */
        analyzeProcessDocumentFromUrl: function(url, callback) {
            var me = this;
            jQuery.get(url).done(function(data) {
                me.analyzeProcessDocumentString(data);
                if (callback) {
                    callback();
                }
            });
        },
        /**
         * This function takes a string parses it as XML, afterwards the result is passed to
         * analyzeProcessDocument,
         * @param {string} string
         */
        analyzeProcessDocumentString: function(string) {
            var domParser = new DOMParser();
            var bpmnDocument = domParser.parseFromString(string, "application/xml");
            this.analyzeProcessDocument(bpmnDocument);
        },
        /**
         * This function can analyze a DOM Document
         * that is based on the BPMN XSD given here:
         * 
         * http://www.omg.org/spec/BPMN/20100501/BPMN20.xsd
         * 
         * @param {Document} bpmnDocument
         */
        analyzeProcessDocument: function(bpmnDocument) {
            var me = this;
            var userTasks = Array.prototype.slice.call(bpmnDocument.querySelectorAll("userTask"));
            userTasks = userTasks.map(function(userTaskNode) {
                var amountOfInputs = userTaskNode.querySelectorAll("dataInput").length;
                var amountOfOutputs = userTaskNode.querySelectorAll("dataOutput").length;
                var name = userTaskNode.getAttribute("name");
                return {
                    "@name": name,
                    "amountOfInputs": amountOfInputs,
                    "amountOfOutputs": amountOfOutputs,
                    "functionPointType": me.classifyUserTask(userTaskNode, amountOfInputs, amountOfOutputs),
                    "complexity": name.match(/löschen/) ? "Low" : "Average",
                    "node": userTaskNode
                };
            });
            this._oProcessModel.setProperty("/userTasks", userTasks);
            var dataStores = Array.prototype.slice.call(bpmnDocument.querySelectorAll("dataStore"));
            dataStores = dataStores.map(function(dataStoreNode) {
                return {
                    "@name": dataStoreNode.getAttribute("name"),
                    "@capacity": dataStoreNode.getAttribute("capacity"),
                    "complexity": "Low",
                    "node": dataStoreNode
                };
            });
            this._oProcessModel.setProperty("/dataStores", dataStores);

        },
        /**
         * Classifies a user task into EI, EO, and EQ based on some characteristics
         * of the task. 
         */
        classifyUserTask: function(userTaskNode, amountOfInputs, amountOfOutputs) {
            var name = userTaskNode.getAttribute("name");
            if (name.match(/Eingabe/) || name.match(/eingeben/) || name.match(/anlegen/) || name.match(/löschen/)) {
                return "EI";
            } else if (name.match(/speichern/)) {
                return "EO";
            } else if (name.match(/Auswertung/)) {
                return "EO";
            } else if (name.match(/anzeigen/) || name.match(/prüfen/)) {
                return "EQ";
            } else {
                return (amountOfInputs > 0 && amountOfOutputs > 0) ? "EO" : (amountOfInputs > 0 ? "EI" : "EQ");
            }

        },
        /**
         * This function implements the function point calculation
         * from the following blog post:
         * 
         * http://www.incentergy.de/blog/2016/09/26/next-generation-software-cost-estimation-based-on-bpmn-2-0-and-function-point-analysis-cpm-4-3-1/
         * 
         * @param {object} rootOfProcessModel
         */
        formatFunctionPointsForProcessModel: function(rootOfProcessModel) {
            return "Sum of Function points: " + this.calculateFunctionPointsForProcessModel(rootOfProcessModel);
        },
        calculateFunctionPointsForProcessModel: function(rootOfProcessModel) {
            var functionPoints = 0;
            var me = this;
            rootOfProcessModel.dataStores.forEach(function(dataStore) {
                functionPoints += me.calculateFunctionPointsForDataStore(dataStore);
            });
            rootOfProcessModel.userTasks.forEach(function(userTask) {
                functionPoints += me.calculateFunctionPointsForUserTasks(userTask);
            });

            return functionPoints;
        },


        calculateFunctionPointsForDataStore: function(dataStore) {
            if (dataStore.complexity == "Average") {
                return 10;
            } else if (dataStore.complexity == "High") {
                return 15;
            } else {
                return 7;
            }
        },
        calculateFunctionPointsForUserTasks: function(userTask) {
            var functionPointType = userTask.functionPointType;
            if (functionPointType == "EO") {
                if (userTask.complexity == "Low") {
                    return 4;
                } else if (userTask.complexity == "High") {
                    return 7;
                } else {
                    return 5;
                }
                // (functionPointType == "EI" || functionPointType == "EQ")
            } else {
                if (userTask.complexity == "Low") {
                    return 3;
                } else if (userTask.complexity == "High") {
                    return 6;
                } else {
                    return 4;
                }
            }

        },
        onJiraIssueSearch: function(oEvent) {
            var value = oEvent.getParameter("value");
            if (value) {
                this._oSelectJiraIssueDialog.getBinding("items").filter([new Filter("jql", sap.ui.model.FilterOperator.EQ, value)], sap.ui.model.FilterType.Application);
            } else {
                this._oSelectJiraIssueDialog.getBinding("items").filter([], sap.ui.model.FilterType.Application);
            }
        },
        onPressSendToJira: function() {
            var me = this;
            var jiraConfiguration = window.localStorage.jiraConfiguration;
            if (!jiraConfiguration) {
                this.onJiraConfigurationShow({}, function() {
                    me.onPressSendToJira();
                });
            } else {
                jiraConfiguration = JSON.parse(jiraConfiguration);
            }

            var oHeaders = {
                "Authorization": "Basic " + btoa(jiraConfiguration.username + ':' + jiraConfiguration.password)
            };

            var jiraUrl = jiraConfiguration.baseUrl + "/rest/api/2/search";

            var oJiraSearchModel;
            if (!this._oSelectJiraIssueDialog) {
                oJiraSearchModel = new JSONModel();
                this._oSelectJiraIssueDialog = sap.ui.xmlfragment("bpmn2fpa.view.SelectJiraIssueDialog", this);
                this._oSelectJiraIssueDialog.setModel(oJiraSearchModel);
                this.getView().addDependent(this._oSelectJiraIssueDialog);

                // Make sure that the amount of the JIRA result is used
                //this._oSelectJiraIssueDialog.getBinding("items")._getLength = function() {
                //    return this.getModel().getProperty("/total"); // this.aIndices.length;
                //};

                this._oSelectJiraIssueDialog.getBinding("items").isLengthFinal = function() {
                    return this.getModel().getProperty("/total") == this.aIndices.length;
                };

                this._oSelectJiraIssueDialog.getBinding("items").filter = function(aFilters, sFilterType, bReturnSuccess) {

                    var bSuccess = false;
                    if (!aFilters) {
                        aFilters = [];
                    }

                    if (aFilters instanceof Filter) {
                        aFilters = [aFilters];
                    }
                    var me = this;
                    this.sFilterParams = {};
                    aFilters.forEach(function(filter) {
                        me.sFilterParams[filter.sPath] = filter.oValue1;
                    });


                    if (!this.bInitial) {
                        this.iLength = 0;
                        this.iLoadedUntil = 0;
                        this.iLastLength = 0;
                        this.firstRequestAfterFilter = true;
                        this.sChangeReason = ChangeReason.Filter;
                        this._fireRefresh({ reason: this.sChangeReason });
                        bSuccess = true;
                    }

                    if (bReturnSuccess) {
                        return bSuccess;
                    } else {
                        return this;
                    }

                };
                this._oSelectJiraIssueDialog.getBinding("items").getContexts = function(iStartIndex, iLength) {
                    var me2 = this;
                    var aContexts = JSONListBinding.prototype.getContexts.apply(this, arguments);

                    if (aContexts.length < iLength) {
                        var sPrefix = this.oModel.resolve(this.sPath, this.oContext);

                        if (sPrefix && !jQuery.sap.endsWith(sPrefix, "/")) {
                            sPrefix += "/";
                        }

                        for (var i = aContexts.length; i < Math.min(iLength, this.getModel().getProperty("/total")); i++) {
                            var oContext = this.oModel.getContext(sPrefix + i);
                            aContexts.push(oContext);
                        }

                    }

                    if (this.iLoadedUntil === undefined) {
                        this.iLoadedUntil = me._oSelectJiraIssueDialog.getGrowingThreshold();
                    }

                    if (this.iLoadedUntil < iStartIndex + iLength) {
                        // Make sure that all items for the next page are loaded
                        var model = this.getModel();
                        this.fireDataRequested();
                        model.fireRequestSent({ url: jiraUrl, method: "GET", async: true });

                        var parameters = { "startAt": this.iLoadedUntil, "maxResults": me._oSelectJiraIssueDialog.getGrowingThreshold() };
                        if (me2.sFilterParams) {
                            for (var prop in me2.sFilterParams) {
                                if (me2.sFilterParams.hasOwnProperty(prop)) {
                                    var query = me2.sFilterParams[prop];
                                    if (!query.match(/[~="]/)) {
                                        query = 'text ~ "' + query + '"';
                                    }
                                    parameters[prop] = query;
                                }
                            }
                        }

                        // Load them in sync mode
                        model._ajax({
                            url: jiraUrl,
                            async: true,
                            dataType: 'json',
                            cache: false,
                            data: parameters,
                            headers: oHeaders,
                            type: "GET",
                            success: function(oData) {
                                if (me2.firstRequestAfterFilter) {
                                    model.oData = oData;
                                    me2.firstRequestAfterFilter = false;
                                } else {
                                    Array.prototype.push.apply(model.oData.issues, oData.issues);
                                }
                                me2.update();
                                me2.bNeedsUpdate = true;
                                me2.checkUpdate();
                                //register datareceived call as  callAfterUpdate
                                model.fireRequestCompleted({ url: jiraUrl, method: "GET", async: true, success: true });
                                me2.fireDataReceived({ data: oData });
                                me._oSelectJiraIssueDialog._oSearchField._inputElement.style.backgroundColor = "#FFF";
                                me._oSelectJiraIssueDialog._oSearchField._inputElement.title = "";
                            },
                            error: function(request, type, textStatus) {
                                var oError = { message: textStatus, statusCode: request.status, statusText: request.statusText, responseText: request.responseText };
                                jQuery.sap.log.fatal("The following problem occurred: " + textStatus, request.responseText + "," +
                                    request.status + "," + request.statusText);
                                me._oSelectJiraIssueDialog._oSearchField._inputElement.style.backgroundColor = "#EDD";
                                me._oSelectJiraIssueDialog._oSearchField._inputElement.title = request.responseJSON.errorMessages[0];
                            }
                        });
                        this.iLoadedUntil = iStartIndex + iLength;
                        aContexts.dataRequested = true;
                    }
                    return aContexts;
                };

            } else {
                oJiraSearchModel = this._oSelectJiraIssueDialog.getModel();
            }

            oJiraSearchModel.loadData(jiraUrl, { "startAt": 0, "maxResults": this._oSelectJiraIssueDialog.getGrowingThreshold() }, true, "GET", false, false, oHeaders);

            this._oSelectJiraIssueDialog.open();

        },
        onJiraIssueConfirm: function(oEvent) {
            var me = this;
            var selectedJiraIssue = oEvent.getParameter("selectedItem").getBindingContext().getObject();
            var jiraConfiguration = JSON.parse(window.localStorage.jiraConfiguration);
            var oHeaders = {
                "Authorization": "Basic " + btoa(jiraConfiguration.username + ':' + jiraConfiguration.password),
                "Content-Type": "application/json"
            };

            var functionPoints = this.calculateFunctionPointsForProcessModel(this._oProcessModel.getData());


            jQuery.ajax({
                    "url": jiraConfiguration.baseUrl + "/rest/api/2/issue/" + selectedJiraIssue.key,
                    "data": JSON.stringify({
                        "update": {
                            "timetracking": [{ "edit": { "originalEstimate": (functionPoints * 3) + "h" } }],
                            "comment": [{
                                "add": {
                                    "body": me.bpmnToMarkdown(this._oProcessModel)
                                }
                            }]
                        }
                    }),
                    "type": "PUT",
                    "headers": oHeaders
                }).done(function() {
                    MessageToast.show("Added function point analysis to issue");
                })
                .fail(function() {
                    MessageToast.show("Failed to add function point analysis");
                });
        },
        bpmnToMarkdown: function(oProcessModel) {
            var me = this;
            var functionPoints = 0;
            var markDownString = "|| Name || Element || Complexity || Function Points ||\n";

            var rootOfProcessModel = oProcessModel.getData();
            rootOfProcessModel.dataStores.forEach(function(dataStore) {
                var points = me.calculateFunctionPointsForDataStore(dataStore);
                markDownString += "| " + dataStore["@name"] + " | Internal Logical File | " + dataStore.complexity + " | " + points + " |\n";
                functionPoints += points;
            });
            rootOfProcessModel.userTasks.forEach(function(userTask) {
                var points = me.calculateFunctionPointsForUserTasks(userTask);
                markDownString += "| " + userTask["@name"] + " | " + userTask.functionPointType + " | " + userTask.complexity + " | " + points + " |\n";
                functionPoints += points;
            });

            markDownString += "| | | *Sum:* | " + functionPoints + "|\n";

            return markDownString;
        },
        onJiraConfigurationShow: function(oEvent, callback) {
            var oJiraConfigurationModel = new JSONModel({ "baseUrl": "", "username": "", "password": "" });
            if (window.localStorage.jiraConfiguration) {
                oJiraConfigurationModel.setData(JSON.parse(window.localStorage.jiraConfiguration));
            }
            if (!this._oJiraConfigurationDialog) {
                this._oJiraConfigurationDialog = sap.ui.xmlfragment("bpmn2fpa.view.JiraConfigurationDialog", this);
                this._oJiraConfigurationDialog.setModel(oJiraConfigurationModel);
                this.getView().addDependent(this._oJiraConfigurationDialog);
            }
            this._oJiraConfigurationDialog.open();
            if (typeof callback == "function") {
                this._oJiraConfigurationDialog.attachEventOnce("afterClose", function() {
                    callback();
                });
            }
        },
        onJiraConfigurationConfirm: function() {
            window.localStorage.jiraConfiguration = JSON.stringify(this._oJiraConfigurationDialog.getModel().getData());
            this._oJiraConfigurationDialog.close();
        }
    });
});
