import { Component, Input, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngrx/store";
import { keyBy, uniqBy } from "lodash";
import { Observable, of } from "rxjs";
import { getProcedures } from "src/app/core/helpers/get-setmembers-from-departments.helper";
import { loadForms } from "src/app/store/actions";
import { loadActiveVisit } from "src/app/store/actions/visit.actions";
import { AppState } from "src/app/store/reducers";
import { addBillStatusToOrderedItems } from "../../helpers/add-bill-status-to-ordered-items.helper";
import { ICARE_CONFIG } from "../../resources/config";
import { OrdersService } from "../../resources/order/services/orders.service";
import { VisitsService } from "../../resources/visits/services";
import { ConfirmSavingOrderObservationModalComponent } from "../confirm-saving-order-observation-modal/confirm-saving-order-observation-modal.component";

@Component({
  selector: "app-attend-ordered-items",
  templateUrl: "./attend-ordered-items.component.html",
  styleUrls: ["./attend-ordered-items.component.scss"],
})
export class AttendOrderedItemsComponent implements OnInit {
  @Input() orderedItems: any[];
  @Input() currentBills: any[];
  @Input() orderTypeName: string;
  @Input() encounters: any[];
  @Input() patient: any;
  @Input() visit: any;
  @Input() conceptsWithDepartmentsDetails: any[];
  @Input() investigationAndProceduresFormsDetails: any;
  @Input() nursingConfigurations: any;
  @Input() provider: any;
  @Input() orderTypes: any[]
  status: any = {};
  comments: any = {};
  shouldAddNew: boolean = false;
  departmentsDetailsKeyedBySetmembers: any = {};
  procedureFields: any[] = [];
  isFormValid: boolean = false;
  proceduresSelected: any[] = [];
  creatingOrderResponse$: Observable<any>;
  orderedProcedures$: Observable<any>;
  fields: string =
    "custom:(uuid,encounters:(uuid,location:(uuid,display),encounterType,display,encounterProviders,encounterDatetime,voided,obs,orders:(uuid,display,orderer,orderType,dateActivated,orderNumber,concept,display)))";
  constructor(private dialog: MatDialog, private visitService: VisitsService, private store: Store<AppState>, private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.departmentsDetailsKeyedBySetmembers = keyBy(
      this.conceptsWithDepartmentsDetails,
      "uuid"
    );
    this.orderedProcedures$ = this.visitService.getActiveVisitProcedures(
      this.visit.uuid,
      this.fields,
      this.currentBills,
      this.visit?.isEnsured
    );
    this.orderedItems = addBillStatusToOrderedItems(
      this.orderedItems,
      this.currentBills,
      this.encounters,
      this.visit
    );
    this.procedureFields = [
      {
        id: "procedure",
        key: "procedure",
        label: "Procedure",
        name: "Procedure",
        controlType: "dropdown",
        type: "text",
        options:
          this.investigationAndProceduresFormsDetails &&
          this.investigationAndProceduresFormsDetails?.setMembers
            ? getProcedures(
                this.investigationAndProceduresFormsDetails?.setMembers
              )
            : [],
        conceptClass: "procedure",
        otherType: "searchFromOptions",
        shouldHaveLiveSearchForDropDownFields: true,
      },
      {
        id: "remarks",
        key: "remarks",
        label: "Remarks / Instructions",
        name: "Remarks / Instructions",
        controlType: "textbox",
        type: "textarea",
      },
    ];
  }

  onCheck(event, orderedItem): void {
    this.status[orderedItem?.concept?.uuid] = event.checked;
  }

  saveObservationForThisOrder(event: Event, orderedItem): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmSavingOrderObservationModalComponent, {
        width: "30%",
        data: {
          ...orderedItem,
          orderTypeName: this.orderTypeName,
          value: this.status[orderedItem?.order?.concept?.uuid],
          comments: this.comments[orderedItem?.order?.concept?.uuid],
          encounters: this.encounters,
        },
      })
      .afterClosed()
      .subscribe(() => {
        this.store.dispatch(
          loadActiveVisit({ patientId: this.patient?.patient?.uuid })
        );
      });
  }

  addNew(event: Event): void {
    event.stopPropagation();
    this.shouldAddNew = !this.shouldAddNew;
  }

  onGetFormValidity(isFormValid: boolean): void {
    this.isFormValid = isFormValid;
  }

  onGetDefinedProcedures(procedures: any): void {
    this.proceduresSelected = procedures;
  }

  onSave(event: Event, proceduresValues: any): void {
    event.stopPropagation();
    const procedure =
      {
        concept: proceduresValues["procedure"]?.value,
        orderType: this.nursingConfigurations?.orderTypes?.procedureOrder,
        action: "NEW",
        orderer: this.provider?.uuid,
        patient: this.visit?.patientUuid,
        careSetting: !this.visit?.isAdmitted
          ? "OUTPATIENT"
          : "INPATIENT",
        urgency: "ROUTINE",
        instructions: proceduresValues["remarks"]?.value,
        type: "order",
      }

      const orders = uniqBy([procedure],'concept')

      const encounter = {
        visit: this.visit?.uuid,
        location: JSON.parse(localStorage.getItem('currentLocation'))['uuid'],
        patient: this.visit?.patientUuid,
        encounterType: this.nursingConfigurations?.encounterType?.uuid,
        orders: orders,
        encounterProviders: [
          {
            provider: this.provider?.uuid,
            encounterRole: this.nursingConfigurations?.encounterRole?.uuid,
          },
        ],
      }

    this.orderedProcedures$ = of(null)
    this.creatingOrderResponse$ = this.ordersService.createOrdersViaCreatingEncounter(encounter);
    this.creatingOrderResponse$.subscribe(response => {
      if (response) {
        this.orderedProcedures$ = this.visitService.getActiveVisitProcedures(
          this.visit.uuid,
          this.fields,
          this.currentBills,
          this.visit?.isEnsured
        );
      }
    })
  }
}
