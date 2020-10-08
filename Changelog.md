# Changelog

## Unreleased

### Features and Improvements

- Enable restart from cancelled and update restart from failed[#234](https://github.com/PrefectHQ/ui/pull/234)
- Add unit tests for the authNavGuard middleware [#266](https://github.com/PrefectHQ/ui/pull/266)

### Bugfixes

- Fix race condition with `apollo_url` - [#295](https://github.com/PrefectHQ/ui/pull/295)
- Don't pluralize "slot" when only one is being used [#293](https://github.com/PrefectHQ/ui/issues/293)
- Enable global search for task runs without names [#299](https://github.com/PrefectHQ/ui/pull/299)

## 2020-10-05

### Features and Improvements

- Don't display nonexistant user info for flows and flow runs when connected to Prefect Server [#269](https://github.com/PrefectHQ/ui/pull/269)
- Add agent ID to flow run page details for submitted runs [#249](https://github.com/PrefectHQ/ui/pull/249)
- Expose agents page and dashboard tile for server users [#249](https://github.com/PrefectHQ/ui/pull/249)
- Make labels on agent cards scrollable and add ID to information displayed [#249](https://github.com/PrefectHQ/ui/pull/249)

### Bugfixes

- Allow IP address as endpoint for URL cloudhooks [#277](https://github.com/PrefectHQ/ui/pull/277)

## 2020-10-01

### Features and Improvements

- Update information in "Connect the UI" section of the home view [#271](https://github.com/PrefectHQ/ui/pull/271)

### Bugfixes

- Make sure the 'To The Dashboard' button is more visible on the onboard/resources page [#275](https://github.com/PrefectHQ/ui/pull/275)
- Allow label edit on flows created with an older version of core [#273](https://github.com/PrefectHQ/ui/pull/273)
- Redirect to home when UI is loaded up against a Prefect Server instance with no tenants [#270](https://github.com/PrefectHQ/ui/pull/270)
- Direct users to the new tenant when they accept an invitation from the accept invitation page [#274](https://github.com/PrefectHQ/ui/pull/274)

## 2020-09-29

### Features and Improvements

- Add unit tests for the flow navigation guard [#248](https://github.com/PrefectHQ/ui/pull/248)

### Bugfixes

- Hide label affinity warning in server until Core catches up [#264](https://github.com/PrefectHQ/ui/pull/264)
- Fixes a situation where task runs in the table on the flow run page were incorrectly calculating infinite durations - [#267](https://github.com/PrefectHQ/ui/pull/267)

## 2020-09-28a

### Features and Improvements

- Add Vuex user store unit tests and add circleci job to run unit tests on PR [#245](https://github.com/PrefectHQ/ui/pull/245)

### Bugfixes

- Remove link to Cloud tutorials from Server [#255](https://github.com/PrefectHQ/ui/pull/255)
- Fixes instances where allowed users and allowed read only users weren't always being read correctly when license terms were null - [#260](https://github.com/PrefectHQ/ui/pull/260)

## 2020-09-28

### Features and Improvements

- Show user notifications on the notifications tile - [#258](https://github.com/PrefectHQ/ui/pull/258)
- Add dense styling for the WhatsNew notification component - [#258](https://github.com/PrefectHQ/ui/pull/258)

## 2020-09-24

### Bugfixes

- Fix `delete_agent` mutation `agentId` type [#253](https://github.com/PrefectHQ/ui/pull/253)
- Add 24 hour clock to the logs row [#247](https://github.com/PrefectHQ/ui/pull/247)

## 2020-09-23

### Features and Improvements

- Show version group id on the flow details tile[#236](https://github.com/PrefectHQ/ui/pull/236)
- Add a check for flow and agent label alignment and alert if mis-matched [#217](https://github.com/PrefectHQ/ui/pull/217)
- Add unit tests for tenant store [#195](https://github.com/PrefectHQ/ui/pull/195)
- Improves error handling related to garbage collection - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Improves component teardown by accounting for elements whose destroyed method had been called but that hadn't been removed from the DOM due to transitions - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Improve navigation experience when going forward/backward in the browser history - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Improve the usability of apollo endpoint setting - [#241](https://github.com/PrefectHQ/ui/pull/241)

## 2020-09-17

### Features and Improvements

- Add unit tests for tenant store [#195](https://github.com/PrefectHQ/ui/pull/195)
- Improves error handling related to garbage collection - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Improves component teardown by accounting for elements whose destroyed method had been called but that hadn't been removed from the DOM due to transitions - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Improve navigation experience when going forward/backward in the browser history - [#232](https://github.com/PrefectHQ/ui/pull/232)

### Bugfixes

- Fixes errors that were thrown when routing to tenant-guarded pages without passing a tenant slug - [#232](https://github.com/PrefectHQ/ui/pull/232)
- Fix a race condition with flow concurrency usage - [#231](https://github.com/PrefectHQ/ui/pull/231)
- Fix a race condition with task tag concurrency usage - [#235](https://github.com/PrefectHQ/ui/pull/235)

## 2020-09-15

### Features and Improvements

- Fix app-wide component teardown by manually nulling references that were preventing the garbage colector from running correctly - [#212](https://github.com/PrefectHQ/ui/pull/212)
- Remove `task_run` join from the Dashboard-level Upcoming Runs query - [#218](https://github.com/PrefectHQ/ui/pull/218)
- Introduce a notifications tile - [#220](https://github.com/PrefectHQ/ui/pull/220)

### Bugfixes

- Improve error handling on the flow page schedule toggle and label setting [#217](https://github.com/PrefectHQ/ui/pull/217)
- Fix BarChart component resize event listener removal - [#212](https://github.com/PrefectHQ/ui/pull/212)
- Remove all BarChart underscore method and property references - [#212](https://github.com/PrefectHQ/ui/pull/212)
- Fix visual bugs associated with resizing while the BarChart component wasn't visible - [#216](https://github.com/PrefectHQ/ui/pull/216)
- Fix bug preventing late runs from being cleared in the UI - [#227](https://github.com/PrefectHQ/ui/pull/227)

## 2020-09-08

### Features and Improvements

- Add unit test for the auth0 Vuex store[#162](https://github.com/PrefectHQ/ui/pull/162)
- Remove deprecated route calls from Task Concurrency page - [#193](https://github.com/PrefectHQ/ui/pull/193)
- Add a loading state for accepting invitations in the sidenav and a warning before a user removes themself from a tenant [#190](https://github.com/PrefectHQ/ui/pull/190)
- Changes to the barchart visualization to take browser visibility into account when performing repaints of the canvas and svg elements - [201](https://github.com/PrefectHQ/ui/pull/201)
- Removes `task_run` joins on the upcoming runs queries for both the dashboard and flow pages - [201](https://github.com/PrefectHQ/ui/pull/201)
- Create service worker scaffolding - [201](https://github.com/PrefectHQ/ui/pull/201)
- Use native JavaScript Date objects instead of `moment` for duration calculations - [201](https://github.com/PrefectHQ/ui/pull/201)
- Export the Apollo cache - [201](https://github.com/PrefectHQ/ui/pull/201)
- Display the token name instead of the token id on the agent card - [#200](https://https://github.com/PrefectHQ/ui/pull/200)
- Add new Flow Concurrency page for managing user-driven flow concurrency limits - [#199](https://github.com/PrefectHQ/ui/pull/199)

### Bugfixes

- Keep the approve button in a loading state until the task state updates from paused to resume [#192](https://github.com/PrefectHQ/ui/pull/192)

## 2020-09-1

### Features and Improvements

- Add unit tests for the api Vuex store [#127](https://github.com/PrefectHQ/ui/pull/127)
- Rename "Mark As" to "Set State" for clarity - [#183](https://github.com/PrefectHQ/ui/pull/183)
- Add link to task run page from gantt chart - [#185](https://github.com/PrefectHQ/ui/pull/185)
- Add unit tests for the license Vuex store [#164](https://github.com/PrefectHQ/ui/pull/164)
- Show (sorted) default parameters in the flow details tile and add an info card with link to the flow settings tab [#176](https://github.com/PrefectHQ/ui/pull/176)
- Clean up the flow run restart dialog - [#186](https://github.com/PrefectHQ/ui/pull/186)

### Bugfixes

- Fix bug with Restart from Failed rerunning successfull mapped child tasks - [#182](https://github.com/PrefectHQ/ui/issues/182)

## 2020-08-31a

### Features and Improvements

- Display number of expected mapped runs when the data exists - [#173](https://github.com/PrefectHQ/ui/issues/173)
- August package updates [#180](https://github.com/PrefectHQ/ui/pull/180):
  - [@babel/runtime@7.11.2](https://www.npmjs.com/package/@babel/runtime/v/7.11.2)
  - [@vue/cli-plugin-babel@4.5.4](https://www.npmjs.com/package/@vue/cli-plugin-babel/v/4.5.4)
  - [@vue/cli-service@4.5.4](https://www.npmjs.com/package/@vue/cli-service/v/4.5.4)
  - [@babel/plugin-transform-runtime@7.11.5](https://www.npmjs.com/package/@babel/plugin-transform-runtime/v/7.11.5)
  - [@vue/cli-plugin-eslint@4.5.4](https://www.npmjs.com/package/@vue/cli-plugin-eslint/v/4.5.4)
  - [@vue/cli-plugin-unit-jest@4.5.4](https://www.npmjs.com/package/@vue/cli-plugin-unit-jest/v/4.5.4)
  - [babel-jest@26.3.0](https://www.npmjs.com/package/babel-jest/v/26.3.0)
  - [@auth0/auth0-spa-js@1.11.0](https://www.npmjs.com/package/@auth0/auth0-spa-js/v/1.11.0)
  - [@babel/core@7.11.5](https://www.npmjs.com/package/@babel/core/v/7.11.5)
  - [@vue/test-utils@1.0.5](https://www.npmjs.com/package/@vue/test-utils/v/1.0.5)
  - [cronstrue@1.100.0](https://www.npmjs.com/package/cronstrue/v/1.100.0)
  - [codemirror-graphql@0.12.1](https://www.npmjs.com/package/codemirror-graphql/v/0.12.1)
  - [d3-selection@2.0.0](https://www.npmjs.com/package/d3-selection/v/2.0.0) (_removed_)
  - [codemirror@5.57.0](https://www.npmjs.com/package/codemirror/v/5.57.0)
  - [d3@6.1.1](https://www.npmjs.com/package/d3/v/6.1.1)
  - [logrocket@1.0.12](https://www.npmjs.com/package/logrocket/v/1.0.12)
  - [eslint@7.8.0](https://www.npmjs.com/package/eslint/v/7.8.0)
  - [js-beautify@1.13.0](https://www.npmjs.com/package/js-beautify/v/1.13.0)
  - [d3-zoom@2.0.0](https://www.npmjs.com/package/d3-zoom/v/2.0.0)
  - [sinon@9.0.3](https://www.npmjs.com/package/sinon/v/9.0.3)
  - [vue-code-highlight@0.7.5](https://www.npmjs.com/package/vue-code-highlight/v/0.7.5)
  - [vue-router@3.4.3](https://www.npmjs.com/package/vue-router/v/3.4.3)
  - [start-server-and-test@1.11.3](https://www.npmjs.com/package/start-server-and-test/v/1.11.3)
  - [stylelint@13.7.0](https://www.npmjs.com/package/stylelint/v/13.7.0)
  - [vue@2.6.12](https://www.npmjs.com/package/vue/v/2.6.12)
  - [vue-template-compiler@2.6.12](https://www.npmjs.com/package/vue-template-compiler/v/2.6.12)
  - [vuetify@2.3.10](https://www.npmjs.com/package/vuetify/v/2.3.10)

### Bugfixes

- Filter scheduled flows from the activity timeline [#188](https://https://github.com/PrefectHQ/ui/pull/188)

## 2020-08-31

### Features and Improvements

- Update scrollbars with platform-specific styling [#177](https://github.com/PrefectHQ/ui/pull/177)

### Bugfixes

- Fix "overenthusiastic" scrollbars on non-Mac systems [#177](https://github.com/PrefectHQ/ui/pull/177)
- Remove token name length requirement in run flow tutorial [#174](https://github.com/PrefectHQ/ui/pull/174)

## 2020-08-28

### Features and Improvements

- Add unit tests for the refresh and sidenav Vuex stores [#165](https://github.com/PrefectHQ/ui/pull/165)
- Improve state setting UX and restarting flow runs from failure - [#163](https://github.com/PrefectHQ/ui/pull/163)
- Remove references to task and flow run durations [#169](https://github.com/PrefectHQ/ui/pull/169)

### Bugfixes

- Fix log generation when restarting flow runs from failure - [#163](https://github.com/PrefectHQ/ui/pull/163)
- Fix membership invitation toasts [#166](https://github.com/PrefectHQ/ui/pull/166)
- Fix bad labels references for older flows that were preventing the Flow page details tile from rendering correctly [#171](https://github.com/PrefectHQ/ui/pull/171)

## 2020-08-27

### Features and Improvements

- Remove stale references to `run_count` from all GQL queries - [#157](https://github.com/PrefectHQ/ui/pull/157)

### Bugfixes

- Don't show maintenance mode on load (unless it's true) [#159](https://github.com/PrefectHQ/ui/pull/159)

## 2020-08-26

### Features and Improvements

- Update connection icon if Cloud is in maintenance mode - [#155](https://github.com/PrefectHQ/ui/pull/155)

## 2020-08-25

### Features and Improvements

- Add Flow ID to Flow Details Tile - [#135](https://github.com/PrefectHQ/ui/issues/135)

### Bugfixes

- Show payment details in the account page and improve tenant-slug update error handling [#140](https://github.com/PrefectHQ/ui/pull/140)

## 2020-08-24

### Features and Improvements

- Improve handling of cancelling state [#137](https://github.com/PrefectHQ/ui/pull/137)
- Add unit tests for the agent and alert vuex stores[#124](https://github.com/PrefectHQ/ui/pull/124)
- Add way of retrieving archived logs for old flow and task runs - [#128](https://github.com/PrefectHQ/ui/pull/128)

## 2020-08-20

### Bugfixes

- Make dashboard update when a user switches tenant [#123](https://github.com/PrefectHQ/ui/pull/123)

## 2020-08-19

### Bugfixes

- Fix issue with creating new task concurrency limits [#122](https://github.com/PrefectHQ/ui/pull/122)

## 2020-08-18

### Hello, world!

- Add a default parameters page in flow settings[#24](https://github.com/PrefectHQ/ui/pull/24)
- Switch the errors tile to become a failed tasks tile and add better timeout error handling [#6](https://github.com/PrefectHQ/prefect-ui/pull/6)
- Improve the error message design on the flow failures and task failures tiles[#13](https://github.com/PrefectHQ/prefect-ui/pull/13)
- Fix order of "last ten runs" on the flows page [#50](https://github.com/PrefectHQ/ui/pull/50)
- Fix issue with Failed Tasks tile incorrectly displaying with a red color - [#88](https://github.com/PrefectHQ/ui/issues/88)
- Add cancellation button to Flow Run pages [#92](https://github.com/PrefectHQ/ui/pull/92)
- Add text-area to allow a user to add and/or remove labels from the flow details tile [#106](https://github.com/PrefectHQ/ui/pull/106)
- Name the restart mutation and fix casing on the restart mutation variable [#98](https://github.com/PrefectHQ/ui/pull/98)
- Add Created On column to Flow Table - [#103](https://github.com/PrefectHQ/ui/pull/103)
- Improve schedule toggling reactivity [#104](https://github.com/PrefectHQ/ui/pull/104/files)
- Update tenant CLI command in CreateTenant section - [#105](https://github.com/PrefectHQ/ui/pull/105)
- Add an alert to remind users they are on Prefect Cloud if they toggle from Server [#108](https://github.com/PrefectHQ/ui/pull/108)
- Disable Cancel button after pressing it once - [#116](https://github.com/PrefectHQ/ui/pull/116)
- Remove EMAIL Cloud Hook from Server options - [#116](https://github.com/PrefectHQ/ui/pull/116)
