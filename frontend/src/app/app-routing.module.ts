import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
  },
  // {
  //   path: 'proxies',
  //   component: ProxiesComponent,
  // },
  // {
  //   path: 'create-proxy',
  //   component: CreateProxyComponent,
  // },
  // {
  //   path: 'bins',
  //   component: BinsComponent,
  // },
  // {
  //   path: 'create-bin',
  //   component: CreateBinComponent,
  // },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
