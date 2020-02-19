import { NoteListComponent } from '@sunbird/notes';
import {
  LearnPageComponent, CourseConsumptionPageComponent, CoursePlayerComponent,
  EnrollBatchComponent, UnEnrollBatchComponent, CreateBatchComponent, UpdateCourseBatchComponent,
  LivesessionComponent
} from './components';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ResourceService } from '@sunbird/shared';
import { FlagContentComponent, AuthGuard } from '@sunbird/core';
import { CourseProgressComponent } from '@sunbird/dashboard';
import { RedirectComponent } from './../shared/components/redirect/redirect.component';
import { ViewAllComponent } from '@sunbird/shared-feature';
import { CourseDeliveryPageComponent } from './components/course-consumption/course-delivery-page/course-delivery-page.component';
import { LiveSessionUrlComponent } from './components/live-session-url/live-session-url.component';
const telemetryEnv = 'course';
const objectType = 'course';
const routes: Routes = [
  {
    path: '', component: LearnPageComponent,
    data: {
      breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '' }],
      telemetry: { env: telemetryEnv, pageid: 'learn', type: 'view' },
      baseUrl: 'learn'
    }
  },
  {
    path: 'redirect', component: RedirectComponent,
    data: {
      telemetry: { env: telemetryEnv, pageid: 'learn-redirect', type: 'view' }
    }
  },
  {
    path: 'view-all/:section/:pageNumber', component: ViewAllComponent,
    data: {
      breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }],
      telemetry: {
        env: telemetryEnv, pageid: 'view-all', type: 'view', subtype: 'paginate'
      },
      baseUrl: 'learn',
      filterType: 'courses',
      frameworkName: true,
      formAction: 'filter'
    }
  },
  {
    path: 'course', component: CourseConsumptionPageComponent,
    data: { telemetry: { env: telemetryEnv } },
    children: [
      {
        path: ':courseId', component: CoursePlayerComponent,
        data: {
          telemetry: {
            env: telemetryEnv, pageid: 'course-player', type: 'view', object: { ver: '1.0', type: 'batch' }
          },
          breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
        },
        children: [
          { path: 'flag', component: FlagContentComponent },
          {
            path: 'enroll/batch/:batchId', component: EnrollBatchComponent,
            data: {
              telemetry: { env: telemetryEnv, pageid: 'batch-enroll', type: 'view', object: { ver: '1.0', type: 'batch' } }
            }
          },
          {
            path: 'update/batch/:batchId', component: UpdateCourseBatchComponent, canActivate: [AuthGuard],
            data: {
              telemetry: { env: telemetryEnv, pageid: 'batch-edit', type: 'view', object: { ver: '1.0', type: 'batch' } },
              roles: 'coursebacthesRole'
            }
          },
          {
            path: 'create/batch', component: CreateBatchComponent, canActivate: [AuthGuard],
            data: {
              telemetry: {
                env: telemetryEnv, pageid: 'batch-create', type: 'view', mode: 'create',
                object: { ver: '1.0', type: 'batch' }
              },
              roles: 'coursebacthesRole'
            }
          },
          {
            path: 'create/livesession/batch/:batchId', component: LivesessionComponent, canActivate: [AuthGuard],
            data: {
              telemetry: {
                env: telemetryEnv, pageid: 'batch-create', type: 'view', mode: 'create',
                object: { ver: '1.0', type: 'batch' }
              },
              roles: 'coursebacthesRole'
            }
          }

        ]
      },
      {
        path: ':courseId/dashboard', component: CourseProgressComponent, canActivate: [AuthGuard],
        data: {
          roles: 'coursebacthesRole',
          telemetry: { env: telemetryEnv, pageid: 'course-stats', type: 'view', object: { ver: '1.0', type: 'course' } }
        }
      },
      {
        path: ':courseId/batch/:batchId', component: CoursePlayerComponent,
        data: {
          telemetry: { env: telemetryEnv, pageid: 'course-read', type: 'workflow', object: { ver: '1.0', type: 'course' } },
          breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
        },
        children: [
          { path: 'flag', component: FlagContentComponent },
          {
            path: 'unenroll/batch/:batchId', component: UnEnrollBatchComponent,
            data: {
              telemetry: { env: telemetryEnv, pageid: 'batch-enroll', type: 'view', object: { ver: '1.0', type: 'batch' } }
            }
          },
        ]
      },
      {
        path: ':courseId/batch/:batchId/notes', component: NoteListComponent,
        data: {
          telemetry: {
            env: telemetryEnv, pageid: 'content-note-read', type: 'list', object: { type: objectType, ver: '1.0' }
          }, breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
        },
        children: [{ path: 'flag', component: FlagContentComponent }]
      },
      {
        path: ':courseId/batch/:batchId/notes/:contentId', component: NoteListComponent,
        data: {
          telemetry: {
            env: telemetryEnv, pageid: 'content-note-read', type: 'list', object: { type: objectType, ver: '1.0' }
          }, breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
        },
        children: [{ path: 'flag', component: FlagContentComponent }]
      },
      {
        path: ':courseId/:courseStatus', component: CoursePlayerComponent,
        data: {
          telemetry: {
            env: telemetryEnv, pageid: 'course-player-unlisted', type: 'view', object: { ver: '1.0', type: 'batch' }
          },
          breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
        }
      },
      { path: ':courseId/batch/:batchId/live-session' , component: LiveSessionUrlComponent},
    ]
  },
  {
    path: 'learn/live-session', component: LiveSessionUrlComponent
  },
  {
    path: 'play/batch/:batchId/course/:courseId', component: CourseDeliveryPageComponent,
    data: {
      telemetry: { env: telemetryEnv, pageid: 'course-read', type: 'workflow', object: { ver: '1.0', type: 'course' } },
      breadcrumbs: [{ label: 'Home', url: '/home' }, { label: 'Courses', url: '/learn' }]
    },
    children: [
      { path: 'flag', component: FlagContentComponent },
      {
        path: 'unenroll/batch/:batchId', component: UnEnrollBatchComponent,
        data: {
          telemetry: { env: telemetryEnv, pageid: 'batch-enroll', type: 'view', object: { ver: '1.0', type: 'batch' } }
        }
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LearnRoutingModule { }
