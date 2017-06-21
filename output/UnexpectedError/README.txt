------------------------------
Description of files included:
------------------------------

report_1.log
    - Parameter change using a simple part (https://static.factoryfour.com/pq/typeF_v12.ipt)
    - Always runs successfully
    - Runtime around 45 seconds

report_2.log
    - Parameter change using more complicated part (https://static.factoryfour.com/pq/typeF_v31_shape8.ipt.)
    - Execution usually fails with "An unexpected error happened during phase CoreEngineExecution of job."
    - Runtime around 75 seconds
    
report_3.log
    - Parameter change using more complicated part (https://static.factoryfour.com/pq/typeF_v31_shape8.ipt.)
    - Execution runs successfully very rarely
    - Runtime around 65 seconds

Output.stl
    - A successfully rendered STL from the work item shown in report_3.log

------------------------------
Work Item Parameters:
------------------------------

Medium resolution output:
    - Activity: SampleActivity
    - AppPackage: samplePlugin

High resolution output:
    - Activity: FF_Activity_17
    - AppPackage: FF_AppPackage_17

Using the following parameters to modify and work item configuration...

const parametersToModify = {
    "PupilDist": 66.4,
    "SupMed_h": 7.7,
    "SupLat_h": 18.5,
    "InfLat_h": 27.8,
    "InfMed_h": 21.6,
    "SupMed_w": 2.8,
    "SupLat_w": 65,
    "InfLat_w": 56.4,
    "InfMed_w": 12.3,
    "SupMedRounding": 6,
    "SupLatRounding": 6,
    "InfLatRounding": 8,
    "InfMedRounding": 12,
    "SupMedThickness": 3.6,
    "SupLatThickness": 6.9,
    "InfLatThickness": 2.2,
    "InfMedThickness": 2,
    "BridgeHeight": 6.7,
    "BridgeThickness": 6,
    "TempleHeight": 8.9,
    "HingeThickness": 6
}

const workItemConfig = {
    Arguments: {
        InputArguments: [
            // Specify the input part
            {
                Resource: 'https://static.factoryfour.com/pq/typeF_v31_shape8.ipt',
                Name: 'HostDwg',
                StorageProvider: 'Generic',
                HttpVerb: 'GET'
            },
            // Change the parameters
            {
                Resource: 'data:application/json,' + JSON.stringify(parametersToModify),
                Name: 'ChangeParameters',
                StorageProvider: 'Generic',
                ResourceKind: 'Embedded'
            }
        ],
        // Output arguments
        OutputArguments: [
            {
                Name: 'Result',
                StorageProvider: 'Generic',
                HttpVerb: 'POST'
            }
        ]
    },
    ActivityId: 'FF_Activity_17',
    Id: ''
};