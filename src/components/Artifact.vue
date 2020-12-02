<script>
/* eslint-disable vue/no-v-html */
const test = `

# Validation Results

## Overview
### **Expectation Suite:** **yellow_tripdata_sample_2019-01.warning**
**Data asset:** **None**
**Status:**  **Succeeded**


### Statistics

| | |
| ------------ | ------------ | 
| Evaluated Expectations | 14  |
| Successful Expectations | 14 |
| Unsuccessful Expectations | 0 |
| Success Percent | 100%  |



## Table-Level Expectations

| Status | Expectation | Observed Value |
| ------------ | ------------ | ------------ | 
| ✅  | Must have greater than or equal to **9000** and less than or equal to **11000** rows.  | 10000  |
| ✅  | Must have exactly **18** columns.  | 18  |
| ✅  | Must have these columns in this order: **vendor_id**, **pickup_datetime**, **dropoff_datetime**, **passenger_count**, **trip_distance**, **rate_code_id**, **store_and_fwd_flag**, **pickup_location_id**, **dropoff_location_id**, **payment_type**, **fare_amount**, **extra**, **mta_tax**, **tip_amount**, **tolls_amount**, **improvement_surcharge**, **total_amount**, **congestion_surcharge**  | ['vendor_id', 'pickup_datetime', 'dropoff_datetime', 'passenger_count', 'trip_distance', 'rate_code_id', 'store_and_fwd_flag', 'pickup_location_id', 'dropoff_location_id', 'payment_type', 'fare_amount', 'extra', 'mta_tax', 'tip_amount', 'tolls_amount', 'improvement_surcharge', 'total_amount', 'congestion_surcharge']  |


## pickup_datetime

| Status | Expectation | Observed Value |
| ------------  | ------------  | ------------ | 
| ✅  | values must never be null.  | 100% not null  
| ✅  | values must always be greater than or equal to **1** characters long.  | 0% unexpected  


## trip_distance

| Status | Expectation | Observed Value |
| ------------  | ------------  | ------------ | 
| ✅  | values must never be null.  | 100% not null  
| ✅  | minimum value must be greater than or equal to **-1.0** and less than or equal to **1.0**.  | --  
| ✅  | maximum value must be greater than or equal to **56.95** and less than or equal to **58.95**.  | 57.95  
| ✅  | mean must be greater than or equal to **1.7589909999999995** and less than or equal to **3.7589909999999995**.  | ≈2.758991  
| ✅  | median must be greater than or equal to **0.53** and less than or equal to **2.5300000000000002**.  | 1.53  
| ✅  | quantiles must be within the following value ranges.


| Quantile | Min Value | Max Value |
| ------------  | ------------  | ------------ | 
0.05  | -0.55  | 1.45  
Q1  | -0.09999999999999998  | 1.9  
Median  | 0.53  | 2.5300000000000002  
Q3  | 1.79  | 3.79  
0.95  | 9.31  | 11.31  | 

| Quantile | Value |
| ------------  | ------------ | 
0.05  | 0.45  
Q1  | 0.9  
Median  | 1.53  
Q3  | 2.79  
0.95  | 10.31  
  

## vendor_id

| Status | Expectation | Observed Value |
| ------------  | ------------  | ------------ | 
| ✅  | values must never be null.  | 100% not null  
| ✅  | distinct values must belong to this set: **1** **2** **4**.  | [1, 2, 4]  
| ✅  | Kullback-Leibler (KL) divergence with respect to the following distribution must be lower than **0.6**.Note: Graphs are not currently supported in markdown  | 


<div>
    KL Divergence: **None (-infinity, infinity, or NaN)**
    Note: Graphs are not currently supported in markdown
</div>  


### Info

|  |  |
| ------------  | ------------ | 
Great Expectations Version  | 0.12.10  
Run Name  | some_string_that_uniquely_identifies_this_run  
Run Time  | 2020-12-01T15:00:37.394710Z  


### Batch Markers

 |  |  |
 | ------------  | ------------ | 
**ge_load_time**  | **20201201T150037.379937Z**  
**pandas_data_fingerprint**  | **c4f929e6d4fab001fedc9e075bf4b612**  


### Batch Kwargs

 |  |  |
 | ------------  | ------------ | 
**PandasInMemoryDF**  | **True**  
**datasource**  | **data__dir**  
**ge_batch_id**  | **f873d33c-33e5-11eb-81f5-8c85901e73db**  


-----------------------------------------------------------

Powered by [Great Expectations](https://greatexpectations.io/)
`
import { artifact_parser } from '@/utils/markdownParser'

export default {
  props: {
    artifact: {
      type: Object,
      required: true
    }
  },
  methods: {
    mdParser(md) {
      let parsed = md.substring(2, md.length - 2)
      parsed
      //   .replaceAll('\\n', '\n')
      //   let stripped = parsed.replace(/<\s*(\w+).*?>/gm, '<$1>')
      return artifact_parser(test)
      //   return parser(parsed)
    }
  }
}
</script>

<template>
  <v-card tile>
    <v-card-text class="grey--text text--darken-3">
      <div class="artifact" v-html="mdParser(artifact.data.markdown)"> </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.artifact {
  .table-wrapper {
    max-height: 400px;
  }

  table {
    border: 1px solid rgb(176, 190, 197) !important;
    border-collapse: collapse;
    border-color: rgb(176, 190, 197) !important;
  }

  td {
    padding: 4px 8px;
  }

  thead {
    th:not(:empty) {
      border-bottom: thin solid rgba(0, 0, 0, 0.12);
      border-top: 1px solid rgb(176, 190, 197);
      font-size: 1rem;
      padding: 4px 8px;
      position: sticky;
      text-align: left;
      top: 0;
      z-index: 2;
    }

    th:first-of-type {
      border-left: thin solid rgb(176, 190, 197);
    }

    th:last-of-type {
      border-right: thin solid rgb(176, 190, 197);
    }
  }

  tbody {
    tr:not(:empty) {
      border: 1px solid rgb(176, 190, 197);
      border-bottom: thin solid rgba(0, 0, 0, 0.12);
      transition: background-color 50ms ease-in-out;

      &:focus,
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    tr:last-of-type:not(:empty) {
      border-bottom: 1px solid rgb(176, 190, 197);
    }
  }

  h1:first-of-type {
    margin-top: 0 !important;
  }
}
</style>
