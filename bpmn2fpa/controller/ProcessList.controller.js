sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";
    return Controller.extend("bpmn2fpa.controller.ProcessList", {

        onInit: function() {
            this.getView().setModel(sap.ui.getCore().getModel());
        },
        onItemPress: function(oEvent) {
            this.getOwnerComponent().getRouter().navTo("Process", {
                "fileName": oEvent.getParameter("listItem").getBindingContext().getProperty("name")
            });
        },
        onDelete: function(oEvent) {
            var files = sap.ui.getCore().getModel().getProperty("/files");
            var selectedFiles = this.byId("list").getSelectedItems().map(function(e) {
                return e.getBindingContext().getObject();
            });
            files = files.filter(function(file) {
                return selectedFiles.indexOf(file) == -1;
            });
            sap.ui.getCore().getModel().setProperty("/files", files);
            this.byId("list").removeSelections();
        },
        onAdd: function(oEvent) {
            if (!this._oUploadDialog) {
                this._oUploadDialog = sap.ui.xmlfragment("bpmn2fpa.view.UploadDialog", this);
                this.getView().addDependent(this._oUploadDialog);
            }
            this._oUploadDialog.open();
        },
        onFileSelected: function(oEvent) {
            var files = oEvent.getParameter("files");

            // loop through files
            for (var i = 0; i < files.length; i++) {
                sap.ui.getCore().getModel().addFile(files[i]);
            }
            this._oUploadDialog.close();
            // https://github.com/SAP/openui5/issues/1167
            this.byId("list").getBinding("items").refresh();
        },
        onUploadCancel: function(oEvent) {
            this._oUploadDialog.close();
        }
    });
});