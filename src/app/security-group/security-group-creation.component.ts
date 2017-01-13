import { Component, OnInit, Inject } from '@angular/core';
import { SecurityGroupService } from './security-group.service';
import { SecurityGroup, NetworkRule } from './security-group.model';
import { MdlDialogReference } from 'angular2-mdl';

interface RuleListItem {
  rule: NetworkRule;
  checked: boolean;
}

export interface IRules { // defines what should be passed to inputRules
  templates?: Array<SecurityGroup>; // array of security groups ids
  ingress: Array<NetworkRule>;
  egress: Array<NetworkRule>;
}

@Component({
  selector: 'cs-security-group-creation',
  templateUrl: './security-group-creation.component.html',
  styleUrls: ['./security-group-creation.component.scss'],
})
export class SecurityGroupCreationComponent implements OnInit {
  private items: Array<Array<SecurityGroup>>;
  private selectedGroupIndex: number;
  private selectedColumnIndex: number;
  private selectedRules: Array<Array<RuleListItem>>;

  constructor(
    private dialog: MdlDialogReference,
    private securityGroupService: SecurityGroupService,
    @Inject('rules') private inputRules: IRules
  ) {
    this.items = [[], []];
    this.selectedRules = [[], []];
  }

  public ngOnInit() {
    const securityGroupTemplates = this.securityGroupService.getTemplates();
    const accountSecurityGroups = this.securityGroupService.getList();

    Promise.all([securityGroupTemplates, accountSecurityGroups])
      .then(([templates, groups]) => {
        this.items[0] = templates.concat(groups);

        this.initRulesList();
      });
  }

  public selectGroup(index: number, left: boolean) {
    this.selectedGroupIndex = index;
    this.selectedColumnIndex = left ? 0 : 1;
  }

  public move(left: boolean) {
    if (this.selectedGroupIndex === -1) {
      return;
    }

    const moveToIndex = left ? 0 : 1;
    const moveFromIndex = this.items.length - moveToIndex - 1;

    if (!left) {
      const group = this.items[0][this.selectedGroupIndex];
      for (let i = 0; i < group.ingressRules.length; i++) {
        this.pushIngressRule(group.ingressRules[i], true);
      }

      for (let i = 0; i < group.egressRules.length; i++) {
        this.pushEgressRule(group.egressRules[i], true);
      }
    } else {
      const group = this.items[1][this.selectedGroupIndex];

      let startIndex = 0;
      for (let i = 0; i < this.selectedGroupIndex; i++) {
        startIndex += this.items[1][i].ingressRules.length;
      }
      this.selectedRules[0].splice(startIndex, group.ingressRules.length);

      startIndex = 0;
      for (let i = 0; i < this.selectedGroupIndex; i++) {
        startIndex += this.items[1][i].egressRules.length;
      }
      this.selectedRules[1].splice(startIndex, group.egressRules.length);
    }

    this.items[moveToIndex].push(this.items[moveFromIndex][this.selectedGroupIndex]);
    this.items[moveFromIndex].splice(this.selectedGroupIndex, 1);

    this.selectedGroupIndex = -1;
    this.selectedColumnIndex = -1;
  }

  public onSave() {
    this.dialog.hide({
      templates: this.items[1],
      ingress: this.selectedRules[0].filter(rule => rule.checked).map(item => item.rule),
      egress: this.selectedRules[1].filter(rule => rule.checked).map(item => item.rule),
    });
  }

  public onCancel() {
    this.dialog.hide(this.inputRules);
  }

  private initRulesList() {
    if (!this.inputRules) {
      return;
    }

    if (!this.inputRules.templates || !this.inputRules.templates.length) {
      return;
    }

    for (let i = 0; i < this.inputRules.templates.length; i++) {
      const ind = this.items[0].findIndex(template => template.id === this.inputRules.templates[i].id);

      if (ind === -1) {
        continue;
      }

      this.items[1].push(this.items[0][ind]);
      this.items[0].splice(ind, 1);
    }

    for (let i = 0; i < this.items[1].length; i++) {
      const group = this.items[1][i];
      for (let j = 0; j < group.ingressRules.length; j++) {
        const ind = this.inputRules.ingress.findIndex(rule => {
          return rule.ruleId === group.ingressRules[j].ruleId;
        });
        this.pushIngressRule(group.ingressRules[j], ind !== -1);
      }

      for (let j = 0; j < group.egressRules.length; j++) {
        const ind = this.inputRules.egress.findIndex(rule => {
          return rule.ruleId === group.egressRules[j].ruleId;
        });
        this.pushEgressRule(group.egressRules[j], ind !== -1);
      }
    }
  }

  private pushIngressRule(rule, checked) {
    this.selectedRules[0].push({
      rule,
      checked
    });
  }

  private pushEgressRule(rule, checked) {
    this.selectedRules[1].push({
      rule,
      checked
    });
  }
}