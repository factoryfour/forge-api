# InventorIOSamples

This should contain everything that a Forge developer needs to do to get started writing a sample service or application with the Design Automation API and Inventor.io. It contains the following:
* **samplePlugin** - An Inventor plugin that demonstrates a simple connection to Inventor. This gets loaded into the AppPackage and used in the Samples 
* **samplePluginAppPackage** - The AppPackage that will be used in the samples that includes the *samplePlugin* and shows how to correctly setup an AppPackage for Inventor.io
* **OData** - A C# sample application that demonstrates a basic connection to the Design Automation API and sets up and AppPackage, Activity and WorkItem
* **node.js** - Coming soon?

## Getting started
### Prerequisites
* Visual Studio 2015 or later
* Windows 7 or later

These steps are common for both the OData and node.js sample applications.

1. Register for a Forge application at https://developer-dev.autodesk.com/myapps/create#. You'll need the key and secret for building and running any sample apps
2. Build the samplePlugin solution. This builds both the InventorServer plugin and packages it up to be consumed by the SampleApp
3. Fill in your Forge ConsumerSecret and ConsumerKey in the OData Program.cs file
4. Build and run the Inventor.io.sample program in OData. 
5. Output and Report file will be copied into My Documents folder
