using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Inventor;
using System.Collections.Generic;
using Newtonsoft.Json;

// Debug
using System.Security.AccessControl;

namespace samplePlugin
{

    [ComVisible(true)]
    public class SampleAutomation
    {
        Inventor.InventorServer m_inventorServer;

        public SampleAutomation(Inventor.InventorServer inventorServer)
        {
            m_inventorServer = inventorServer;
        }

        public void Run(Document doc)
        {
            Trace.TraceInformation("Run called with {0}", doc.DisplayName);
            System.IO.File.AppendAllText("output.txt", "Document name: " + doc.DisplayName);
        }

        public void RunWithArguments(Document doc, NameValueMap map)
        {
            StringBuilder traceInfo = new StringBuilder("RunWithArguments called with ");
            traceInfo.Append(doc.DisplayName);
            Trace.TraceInformation(map.Count.ToString());

            // values in map are keyed on _1, _2, etc
            for (int i = 0; i < map.Count; i++)
            {
                traceInfo.Append(" and ");
                traceInfo.Append(map.Value["_" + (i + 1)]);
            }

            Trace.TraceInformation(traceInfo.ToString());

            Trace.TraceInformation("Modifying param _1");
            // First param "_1" should be the filename of the JSON file containing the parameters and values
            string paramFile = map.Value["_1"];
            Trace.TraceInformation("paramFile: " + paramFile);
            string json = System.IO.File.ReadAllText(paramFile);
            Trace.TraceInformation("changeParameters file: \"" + json + "\"");

            PartDocument partDoc = (PartDocument)doc;
            ChangeParameters(json, partDoc);
       
            // Second param "_2" should be the output filename
            string outputFile = map.Value["_2"];

            string dirPath = System.IO.Path.GetDirectoryName(doc.FullDocumentName);
            Trace.TraceInformation("writing file: " + dirPath + "\\" + outputFile);
            doc.SaveAs(dirPath + "\\" + outputFile, false);
            Trace.TraceInformation("output saved");
        }

        public void ChangeParameters(string json, PartDocument doc)
        {
            PartComponentDefinition partDef = doc.ComponentDefinition;

            Dictionary<string, string> parameters = JsonConvert.DeserializeObject<Dictionary<string, string>>(json);
            foreach (KeyValuePair<string, string> entry in parameters)
            {
                // entry.key = param name
                // entry.value = param value string
                Trace.TraceInformation("param to change: {0}:{1}", entry.Key, entry.Value);
                Parameter param1 = partDef.Parameters[entry.Key];
                param1.Expression = entry.Value;

            }
            doc.Update();
            Trace.TraceInformation("doc updated.");
        }
    }
}
