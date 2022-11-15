import { ApiService } from 'src/app/api.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-bin',
  templateUrl: './create-bin.component.html',
  styleUrls: ['./create-bin.component.scss'],
})
export class CreateBinComponent implements OnInit {
  form!: FormGroup;

  constructor(public api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm() {
    this.form = this.fb.group({
      label: [null, Validators.required],
      address: ['D:\\AppSrc\\Alborz\\', Validators.required],
    });
  }

  createProxy() {
    if (this.form.invalid) return;
    this.api.createBin(this.form.value);
  }
}
