using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

using AIO.Operations;
using AIO.ACES.Models;

namespace Autodesk.Inventor.IO.Sample
{
    class Credentials
    {
        //get your ConsumerKey/ConsumerSecret at http://developer.autodesk.com
        public static string ConsumerKey = ""; // Your Forge key here
        public static string ConsumerSecret = ""; // Your Forge secret here
     }

    class AppProperties
    {
        public static string AppPackageId = "samplePlugin";
        public static string EngineVersion = "21.17";
        public static string LocalAppPackage = "../../../AppPackages/samplePlugin.bundle.zip"; // Your local app package
        public static string InputFile = "Box.ipt";
        public static string OutputFile = "Output.ipt";
        public static string ActivityId = "SampleActivity";
        public static string CloudStorage = "https://s3-us-west-2.amazonaws.com/inventor-io-samples/";
        public static string InventorIOBaseUrl = "https://developer.api.autodesk.com/inventor.io/us-east/v2/";
        public static string AuthUrl = "https://developer.api.autodesk.com/authentication/v1/authenticate";
        public static string ReqInputArgName = "HostDwg"; // Required param for now
        public static string OutputArgName = "Result";
        public static string ReportFile = "report.txt";
        public static string ParamFile = "changeParameters.json";
    }

    class Program
    {

        static string GetToken()
        {
            using (var client = new HttpClient())
            {
                var values = new List<KeyValuePair<string, string>>();
                values.Add(new KeyValuePair<string, string>("client_id", Credentials.ConsumerKey));
                values.Add(new KeyValuePair<string, string>("client_secret", Credentials.ConsumerSecret));
                values.Add(new KeyValuePair<string, string>("grant_type", "client_credentials"));
                values.Add(new KeyValuePair<string, string>("scope", "code:all"));
                var requestContent = new FormUrlEncodedContent(values);
                var response = client.PostAsync(AppProperties.AuthUrl, requestContent).Result;
                var responseContent = response.Content.ReadAsStringAsync().Result;
                var resValues = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseContent);
                return resValues["token_type"] + " " + resValues["access_token"];
            }
        }

        static void DownloadToDocs(string url, string localFile)
        {
            var client = new HttpClient();
            var content = (StreamContent)client.GetAsync(url).Result.Content;
            var fname = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), localFile);
            Console.WriteLine("Downloading to {0}.", fname);

            using (var output = System.IO.File.Create(fname))
            {
                content.ReadAsStreamAsync().Result.CopyTo(output);
                output.Close();
            }
        }

        static HttpWebResponse UploadObject(string url, string filePath)
        {
            HttpWebRequest httpRequest = WebRequest.Create(url) as HttpWebRequest;
            httpRequest.Method = "PUT";
            using (Stream dataStream = httpRequest.GetRequestStream())
            {
                byte[] buffer = new byte[8000];
                using (FileStream fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                {
                    int bytesRead = 0;
                    while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        dataStream.Write(buffer, 0, bytesRead);
                    }
                }
            }

            HttpWebResponse response = httpRequest.GetResponse() as HttpWebResponse;
            return response;
        }

        private static AppPackage GetAppPackage(Container container)
        {
            try
            {
                AppPackage appPackage = container.AppPackages.ByKey(AppProperties.AppPackageId).GetValue();
                return appPackage;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception getting AppPackage: " + e.ToString());
            }
            return null;
        }


        private static AppPackage CreateAppPackage(Container container)
        {
            try
            {
                UriBuilder builder = new UriBuilder(container.BaseUri);
                builder.Path += "AppPackages/Operations.GetUploadUrl";
                var url = container.Execute<string>(builder.Uri, "GET", true, null /*new BodyOperationParameter("FileName","foo.zip")*/).First();

                var response = UploadObject(url, AppProperties.LocalAppPackage);
                if (response.StatusCode != HttpStatusCode.OK)
                    return null;

                var package = new AppPackage();
                package.Version = 1;
                package.RequiredEngineVersion = AppProperties.EngineVersion;
                package.Id = AppProperties.AppPackageId;
                package.Resource = url;
                container.AddToAppPackages(package);

                Console.Write("Submitting AppPackage...");
                container.SaveChanges();
                Console.WriteLine("Done.");
                return package;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception posting packgage: " + e.ToString());
            }

            return null;
        }

        static Activity GetActivity(Container container)
        {
            try
            {

                Activity activity = container.Activities.ByKey(AppProperties.ActivityId).GetValue();
                return activity;
            }
            catch (Exception e)
            {
                // Will catch exception if activity doesn't exist, that's ok, just return null                
                Console.WriteLine("Activity does not yet exist: " + AppProperties.ActivityId + " " + e.ToString());
            }
            return null;
        }

        static Activity CreateActivity(Container container)
        {
            try
            {
                Activity activity = new Activity();

                // Setup the required activity properties
                activity.Id = AppProperties.ActivityId;
                activity.AppPackages.Add(AppProperties.AppPackageId);
                activity.RequiredEngineVersion = AppProperties.EngineVersion;
                activity.Instruction = new Instruction()
                {
                    Script = "",
                    CommandLineParameters = AppProperties.ParamFile + " " + AppProperties.OutputFile
                };

                // Setup the input and output parameters for the activity
                activity.Parameters = new Parameters();
                Parameter inputReqParam = new Parameter()
                {
                    Name = AppProperties.ReqInputArgName,
                    LocalFileName = AppProperties.InputFile
                };
                activity.Parameters.InputParameters.Add(inputReqParam);
    
                Parameter inputChangeParam = new Parameter()
                {
                    Name = "ChangeParameters",
                    LocalFileName = AppProperties.ParamFile
                };
                activity.Parameters.InputParameters.Add(inputChangeParam);

                Parameter outputParam = new Parameter()
                {
                    Name = AppProperties.OutputArgName,
                    LocalFileName = AppProperties.OutputFile
                };
                activity.Parameters.OutputParameters.Add(outputParam);

                // Created a new activity
                container.AddToActivities(activity);

                Console.WriteLine("Submitting/Updatating activity...");
                container.SaveChanges();

                return activity;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception posting packgage: " + e.ToString());
            }
            return null;
        }

        static WorkItem CreateWorkItem(Container container, Activity activity)
        {

            try
            {
                //create a workitem
                var wi = new WorkItem()
                {
                    Id = "", //must be set to empty
                    Arguments = new Arguments(),
                    ActivityId = activity.Id /*AppProperties.ActivityId*/
                };

                // The DesignAutomation API current requires this InputArgument.
                wi.Arguments.InputArguments.Add(new Argument()
                {
                    Name = AppProperties.ReqInputArgName,// Must match the input parameter in activity
                    Resource = AppProperties.CloudStorage + AppProperties.InputFile,
                    StorageProvider = StorageProvider.Generic //Generic HTTP download (as opposed to A360)
                    
                });

                //// This shows passing parameters and values into the plug-in
                wi.Arguments.InputArguments.Add(new Argument()
                {
                    Name = "ChangeParameters",
                    Resource = "data:application/json,{\"d2\":\"0.5 in\", \"d3\":\"0.2 in\"}",
                    StorageProvider = StorageProvider.Generic,
                    ResourceKind = ResourceKind.Embedded
                });

                wi.Arguments.OutputArguments.Add(new Argument()
                {
                    Name = AppProperties.OutputArgName, //must match the output parameter in activity
                    StorageProvider = StorageProvider.Generic, //Generic HTTP upload (as opposed to A360)
                    HttpVerb = HttpVerbType.POST, //use HTTP POST when delivering result
                });

                container.AddToWorkItems(wi);
                Console.WriteLine("Submitting workitem...");
                container.SaveChanges();


                return wi;
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception submitting workitem: " + e.ToString());
            }
            return null;

        }

        static void CopyResultToLocal(string url)
        {

        }


        static void Main(string[] args)
        {
            // Setup Authentication and Container object that is used for API access
            var container = new Container(new Uri(AppProperties.InventorIOBaseUrl));
            var token = GetToken();
            container.SendingRequest2 += (sender, e) => e.RequestMessage.SetHeader("Authorization", token);

            // Get AppPackage if one already exists, otherwise create a new Sample AppPackage
            // Typically this is just done once to setup your AppPackage.
            var appPackage = GetAppPackage(container);
            if (appPackage != null)
            {
                try
                {
                    container.DeleteObject(appPackage);
                    container.SaveChanges();
                }
                catch (Exception e)
                {
                    Console.WriteLine("Exception deleting appPackage: " + e.ToString());
                }

            }
            appPackage = CreateAppPackage(container);

            // Get Activity if one already exists, otherwise create a new one
            var activity = GetActivity(container);
            if (activity != null)
            {
                container.DeleteObject(activity);
                container.SaveChanges();
            }
            activity = CreateActivity(container);
 

            // Create a sample work item
            var wi = CreateWorkItem(container, activity);

            //polling loop - wait for result
            do
            {
                Console.WriteLine("Sleeping for 2 sec...");
                System.Threading.Thread.Sleep(2000);
                container.LoadProperty(wi, "Status"); //http request is made here
                Console.WriteLine("WorkItem status: {0}", wi.Status);
            }
            while (wi.Status == ExecutionStatus.Pending || wi.Status == ExecutionStatus.InProgress);

            //re-query the service so that we can look at the details provided by the service
            container.MergeOption = Microsoft.OData.Client.MergeOption.OverwriteChanges;
            wi = container.WorkItems.ByKey(wi.Id).GetValue();

            //download the status report
            var reportUrl = wi.StatusDetails.Report;
            Console.WriteLine("Writing report log to: " + AppProperties.ReportFile);
            DownloadToDocs(reportUrl, AppProperties.ReportFile); // Output to MyDocuments

            //Resource property of the output argument "Result" will have the output url
            var resultUrl = wi.Arguments.OutputArguments.First(a => a.Name == "Result").Resource;
            Console.WriteLine("Writing results to: " + AppProperties.OutputFile);
            DownloadToDocs(resultUrl, AppProperties.OutputFile); // Output to MyDocuments
            
          
        }
    }
}
