import { TelemetryModule } from '@sunbird/telemetry';
import { LearnRoutingModule } from './learn-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@sunbird/shared';
import { SuiModule } from 'ng2-semantic-ui/dist';
import { SlickModule } from 'ngx-slick';
import { ImagePreloadDirective } from './components/course-consumption/course-player/directive/image-preload.directive';
import { NgInviewModule } from 'angular-inport';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LearnPageComponent,
  CoursePlayerComponent,
  CourseConsumptionHeaderComponent,
  CourseConsumptionPageComponent,
  BatchDetailsComponent,
  EnrollBatchComponent,
  CreateBatchComponent,
  UpdateCourseBatchComponent,
  CurriculumCardComponent,
  ActivitytypeCardComponent,
  UnEnrollBatchComponent,
  LivesessionComponent,
  UpdateLivesessionComponent
} from './components';
import {
  CourseConsumptionService,
  CourseBatchService,
  CourseProgressService
} from './services';
import { CoreModule } from '@sunbird/core';
import { NotesModule } from '@sunbird/notes';
import { DashboardModule } from '@sunbird/dashboard';
import { CourseBatchModule } from '@sunbird/course-batch';
import { SharedFeatureModule } from '@sunbird/shared-feature';
import { BatchCardComponent } from './components/batch/batch-card/batch-card.component';
import { TopCategoriesComponent } from './components/top-categories/top-categories.component';
import { CourseDeliveryPageComponent } from './components/course-consumption/course-delivery-page/course-delivery-page.component';
import { LiveSessionUrlComponent } from './components/live-session-url/live-session-url.component';
import { CourseFeedbackComponent } from './components/course-consumption/course-feedback/course-feedback.component';
import { TinyCardsComponent } from './components/course-consumption/tiny-cards/tiny-cards.component';
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SuiModule,
    DashboardModule,
    SlickModule,
    FormsModule,
    LearnRoutingModule,
    CoreModule,
    ReactiveFormsModule,
    NotesModule,
    TelemetryModule,
    CourseBatchModule,
    NgInviewModule,
    SharedFeatureModule
  ],
  providers: [
    CourseConsumptionService,
    CourseBatchService,
    CourseProgressService
  ],
  declarations: [
    LearnPageComponent,
    CoursePlayerComponent,
    CourseConsumptionHeaderComponent,
    CourseConsumptionPageComponent,
    BatchDetailsComponent,
    EnrollBatchComponent,
    CreateBatchComponent,
    UpdateCourseBatchComponent,
    CurriculumCardComponent,
    ActivitytypeCardComponent,
    UnEnrollBatchComponent,
    BatchCardComponent,
    TopCategoriesComponent,
    CourseDeliveryPageComponent,
    LiveSessionUrlComponent,
    LivesessionComponent,
    ImagePreloadDirective,
    UpdateLivesessionComponent,
    CourseFeedbackComponent,
    TinyCardsComponent,
  ]
})
export class LearnModule {}
