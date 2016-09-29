sap.ui.define([
    "bpmn2fpa/controller/ProcessDetails.controller",
    "sap/ui/core/Control",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/routing/Router",
    "sap/ui/model/json/JSONModel",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function(ProcessDetailsController, Control, Controller, UIComponent, Router, JSONModel) {
    "use strict";

    // Taken from: https://github.com/SAP/openui5/blob/master/src/sap.m/test/sap/m/demokit/worklist/webapp/test/unit/controller/App.controller.js

    QUnit.module("bpmn2fpa/view/ProcessDetails.*.js", {

        beforeEach: function() {
            var me = this;
            this.oViewStub = new Control();
            this.oComponentStub = new Control();
            this.oRouter = new Router();

            this.fnMetadataThen = jQuery.noop;
            var oODataModelStub = new JSONModel();
            oODataModelStub.metadataLoaded = function() {
                return {
                    then: this.fnMetadataThen
                };
            }.bind(this);

            this.oComponentStub.setModel(oODataModelStub);
            this.oComponentStub.getContentDensityClass = function() {
                return "sapUiSizeCompact";
            };

            sinon.config.useFakeTimers = false;

            this.oComponentStub.getRouter = function() {
                return me.oRouter;
            };

            sinon.stub(UIComponent, "getRouterFor").returns(this.oRouter);
            sinon.stub(Controller.prototype, "getOwnerComponent").returns(this.oComponentStub);
            sinon.stub(Controller.prototype, "getView").returns(this.oViewStub);
        },

        afterEach: function() {
            Controller.prototype.getOwnerComponent.restore();
            Controller.prototype.getView.restore();
            UIComponent.getRouterFor.restore();

            this.oViewStub.destroy();
            this.oComponentStub.destroy();
            this.oRouter.destroy();
        }
    });

    QUnit.test("Check that onInit does not throw an exception", function(assert) {
        expect(0);
        // Arrange
        var oModelData,
            oView,
            oProcessDetailsController;
        // Act
        oView = sap.ui.xmlview("bpmn2fpa.view.ProcessDetails");
        oProcessDetailsController = oView.getController();

        oProcessDetailsController.onInit();
    });

    QUnit.test("Parse BPMN Model", function(assert) {
        expect(0);
        // Arrange
        var oModelData,
            oView,
            oProcessDetailsController;
        // Act
        oView = sap.ui.xmlview("bpmn2fpa.view.ProcessDetails");
        oProcessDetailsController = oView.getController();

        oProcessDetailsController.onInit();

        oProcessDetailsController.analyzeProcessDocumentFromUrl("../test-data/Manage todos.bpmn");

        oProcessDetailsController.bpmnToMarkdown(oProcessDetailsController._oProcessModel);
    });

});