import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

const BASE_URL = 'http://wsn-427/estimatePoker/back/';

export interface BinDto {
  no?: number;
  id?: number;
  label: string;
  address: string;
}

export interface ProxyDto {
  no?: number;
  Name: string;
  EndPoint: string;
  Enabled: boolean;
}

export enum IStatus {
  VOTING = 1,
  FREEZE = 2,
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private toast: ToastrService) {
    this.readFromLocalStorage();
    this.getInitialData();
    setInterval(() => {
      this.getInitialData();
    }, 2000);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.toast.success('کپی شد');
  }

  readFromLocalStorage() {
    this.ticket = localStorage.getItem('ticket') ?? '';
    try {
      this.user = JSON.parse(localStorage.getItem('user') ?? '{}');
    } catch {
      this.user = { username: '', id: '' };
    }
  }

  writeToLocalStorage() {
    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.setItem('ticket', this.ticket);
  }

  private _logedIn = false;
  private _isAdmin = false;
  private user: any = { username: '', id: '' };
  private ticket = '';
  private description = '';
  private live = false;
  private currentVote: any = -1;
  private currentStatus: IStatus = IStatus.VOTING;
  private users: any[] = [];
  private votes: any[] = [];
  get Username() {
    return this.user.username;
  }

  set Description(d: string) {
    this.description = d;
  }

  get Description() {
    return this.description;
  }

  get CurrentVote() {
    return this.currentVote;
  }

  get IsAdmin() {
    return this._isAdmin;
  }

  get Ticket() {
    return this.ticket;
  }

  get logedIn() {
    return this._logedIn;
  }

  get Users() {
    return this.users;
  }

  get Votes() {
    return this.votes;
  }

  get CurrentStatus() {
    return this.currentStatus;
  }

  set Live(l: boolean) {
    this.live = l;
  }

  get Live() {
    return this.live;
  }

  get CurrentStatusTitle() {
    return this.currentStatus == IStatus.VOTING
      ? 'در حال رای گیری'
      : 'در حال تصمیم گیری';
  }

  get IsFreeze() {
    return this.currentStatus == IStatus.FREEZE;
  }

  createRoom(username: string, ticket: string) {
    this.http
      .post(BASE_URL + 'room/create', { username, ticket })
      .subscribe(({ data }: any) => {
        this.user = data.user;
        this.ticket = ticket;
        this.writeToLocalStorage();
        this._logedIn = true;
        this._isAdmin = true;
        this.users = data.users;
        this.toast.success('اتاق ایجاد شد');
      });
  }

  joinRoom(username: string, ticket: string) {
    this.http
      .post(BASE_URL + 'room/join', { username, ticket })
      .subscribe(({ data }: any) => {
        this.user = data.user;
        this.ticket = ticket;
        this.writeToLocalStorage();
        this._logedIn = true;
        this._isAdmin = false;
        this.users = data.users;
        this.toast.success('شما وارد اتاق شدید');
      });
  }

  getInitialData() {
    if (this.user.id && this.ticket)
      this.http
        .get(
          BASE_URL + `room/state?userId=${this.user.id}&ticket=${this.ticket}`
        )
        .subscribe(({ data }: any) => {
          this.user = data.user;
          this.votes = data.room.votes;
          this.currentVote = data.yourVote;
          this.currentStatus = data.status;
          if (this.live || !this.IsAdmin)
            this.description = data.room.description;
          this.writeToLocalStorage();
          this.users = data.users;
          this._logedIn = true;
          this._isAdmin = data.isAdmin;
        });
  }

  setDesc(force = false) {
    if (!force && !this.live) return;
    if (this.IsAdmin)
      this.http
        .post(BASE_URL + `room/set-desc`, {
          userId: this.user.id,
          ticket: this.ticket,
          description: this.description,
        })
        .subscribe(() => {});
  }

  setVote(vote: number) {
    if (this.IsFreeze) return;
    this.http
      .post(BASE_URL + `vote`, {
        userId: this.user.id,
        ticket: this.ticket,
        vote: vote == this.currentVote ? -1 : vote,
      })
      .subscribe(() => {
        this.currentVote = vote;
      });
  }

  setStatus() {
    if (this.IsAdmin)
      this.http
        .post(BASE_URL + `status`, {
          userId: this.user.id,
          ticket: this.ticket,
          status:
            this.currentStatus == IStatus.VOTING
              ? IStatus.FREEZE
              : IStatus.VOTING,
        })
        .subscribe(() => {
          this.currentStatus =
            this.currentStatus == IStatus.VOTING
              ? IStatus.FREEZE
              : IStatus.VOTING;
        });
  }

  resetVotes() {
    if (!this.IsAdmin) return;
    this.http
      .post(BASE_URL + `resetVote`, {
        userId: this.user.id,
        ticket: this.ticket,
      })
      .subscribe(() => {});
  }

  reset() {
    if (!this.IsAdmin) return;
    this.http
      .post(BASE_URL + `reset`, {
        userId: this.user.id,
        ticket: this.ticket,
      })
      .subscribe(() => {});
  }

  logout() {
    this.http
      .post(BASE_URL + `room/leave`, {
        userId: this.user.id,
        ticket: this.ticket,
      })
      .subscribe(() => {
        this._isAdmin = false;
        this._logedIn = false;
        this.ticket = '';
        this.writeToLocalStorage();
      });
  }
}
