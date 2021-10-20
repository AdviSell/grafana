import React, { PureComponent } from 'react';
import { css, cx } from '@emotion/css';
import {
  Button,
  ConfirmButton,
  Field,
  HorizontalGroup,
  Icon,
  Modal,
  stylesFactory,
  Themeable,
  Tooltip,
  useTheme,
  withTheme,
} from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { AccessControlAction, Organization, OrgRole, UserDTO, UserOrg } from 'app/types';
import { OrgPicker, OrgSelectItem } from 'app/core/components/Select/OrgPicker';
import { OrgRolePicker } from './OrgRolePicker';
import { contextSrv } from 'app/core/core';
import { UserRolePicker } from '../../core/components/RolePicker/UserRolePicker';

interface Props {
  orgs: UserOrg[];
  user?: UserDTO;
  isExternalUser?: boolean;

  onOrgRemove: (orgId: number) => void;
  onOrgRoleChange: (orgId: number, newRole: OrgRole) => void;
  onOrgAdd: (orgId: number, role: OrgRole) => void;
}

interface State {
  showAddOrgModal: boolean;
}

export class UserOrgs extends PureComponent<Props, State> {
  state = {
    showAddOrgModal: false,
  };

  showOrgAddModal = (show: boolean) => () => {
    this.setState({ showAddOrgModal: show });
  };

  render() {
    const { user, orgs, isExternalUser, onOrgRoleChange, onOrgRemove, onOrgAdd } = this.props;
    const { showAddOrgModal } = this.state;
    const addToOrgContainerClass = css`
      margin-top: 0.8rem;
    `;
    const canAddToOrg = contextSrv.hasPermission(AccessControlAction.OrgUsersAdd);
    return (
      <>
        <h3 className="page-heading">Organizations</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <table className="filter-table form-inline">
              <tbody>
                {orgs.map((org, index) => (
                  <OrgRow
                    key={`${org.orgId}-${index}`}
                    isExternalUser={isExternalUser}
                    user={user}
                    org={org}
                    onOrgRoleChange={onOrgRoleChange}
                    onOrgRemove={onOrgRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className={addToOrgContainerClass}>
            {canAddToOrg && (
              <Button variant="secondary" onClick={this.showOrgAddModal(true)}>
                Add user to organization
              </Button>
            )}
          </div>
          <AddToOrgModal isOpen={showAddOrgModal} onOrgAdd={onOrgAdd} onDismiss={this.showOrgAddModal(false)} />
        </div>
      </>
    );
  }
}

const getOrgRowStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    removeButton: css`
      margin-right: 0.6rem;
      text-decoration: underline;
      color: ${theme.palette.blue95};
    `,
    label: css`
      font-weight: 500;
    `,
    disabledTooltip: css`
      display: flex;
    `,
    tooltipItem: css`
      margin-left: 5px;
    `,
    tooltipItemLink: css`
      color: ${theme.palette.blue95};
    `,
    rolePickerWrapper: css`
      display: flex;
    `,
    rolePicker: css`
      flex: auto;
      margin-right: ${theme.spacing.sm};
    `,
  };
});

interface OrgRowProps extends Themeable {
  user?: UserDTO;
  org: UserOrg;
  isExternalUser?: boolean;
  onOrgRemove: (orgId: number) => void;
  onOrgRoleChange: (orgId: number, newRole: OrgRole) => void;
}

class UnThemedOrgRow extends PureComponent<OrgRowProps> {
  state = {
    currentRole: this.props.org.role,
    isChangingRole: false,
  };

  onOrgRemove = () => {
    const { org } = this.props;
    this.props.onOrgRemove(org.orgId);
  };

  onChangeRoleClick = () => {
    const { org } = this.props;
    this.setState({ isChangingRole: true, currentRole: org.role });
  };

  onOrgRoleChange = (newRole: OrgRole) => {
    this.setState({ currentRole: newRole });
  };

  onOrgRoleSave = () => {
    this.props.onOrgRoleChange(this.props.org.orgId, this.state.currentRole);
  };

  onCancelClick = () => {
    this.setState({ isChangingRole: false });
  };

  onBuiltinRoleChange = (newRole: OrgRole) => {
    this.props.onOrgRoleChange(this.props.org.orgId, newRole);
  };

  render() {
    const { user, org, isExternalUser, theme } = this.props;
    const styles = getOrgRowStyles(theme);
    const labelClass = cx('width-16', styles.label);
    const canChangeRole = contextSrv.hasPermission(AccessControlAction.OrgUsersRoleUpdate);
    const canRemoveFromOrg = contextSrv.hasPermission(AccessControlAction.OrgUsersRemove);
    const rolePickerDisabled = isExternalUser || !canChangeRole;

    return (
      <tr>
        <td className={labelClass}>{org.name}</td>
        <td className="width-20">
          <div className={styles.rolePickerWrapper}>
            <div className={styles.rolePicker}>
              <UserRolePicker
                userId={user?.id || 0}
                orgId={org.orgId}
                builtinRole={org.role}
                onBuiltinRoleChange={this.onBuiltinRoleChange}
                disabled={rolePickerDisabled}
              />
            </div>
            {isExternalUser && <ExternalUserTooltip />}
          </div>
        </td>
        <td colSpan={1}>
          <div className="pull-right">
            {canRemoveFromOrg && (
              <ConfirmButton
                confirmText="Confirm removal"
                confirmVariant="destructive"
                onCancel={this.onCancelClick}
                onConfirm={this.onOrgRemove}
              >
                Remove from organization
              </ConfirmButton>
            )}
          </div>
        </td>
      </tr>
    );
  }
}

const OrgRow = withTheme(UnThemedOrgRow);

const getAddToOrgModalStyles = stylesFactory(() => ({
  modal: css`
    width: 500px;
  `,
  buttonRow: css`
    text-align: center;
  `,
  modalContent: css`
    overflow: visible;
  `,
}));

interface AddToOrgModalProps {
  isOpen: boolean;

  onOrgAdd(orgId: number, role: string): void;

  onDismiss?(): void;
}

interface AddToOrgModalState {
  selectedOrg: Organization | null;
  role: OrgRole;
}

export class AddToOrgModal extends PureComponent<AddToOrgModalProps, AddToOrgModalState> {
  state: AddToOrgModalState = {
    selectedOrg: null,
    role: OrgRole.Admin,
  };

  onOrgSelect = (org: OrgSelectItem) => {
    this.setState({ selectedOrg: org.value! });
  };

  onOrgRoleChange = (newRole: OrgRole) => {
    this.setState({
      role: newRole,
    });
  };

  onAddUserToOrg = () => {
    const { selectedOrg, role } = this.state;
    this.props.onOrgAdd(selectedOrg!.id, role);
  };

  onCancel = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
  };

  render() {
    const { isOpen } = this.props;
    const { role } = this.state;
    const styles = getAddToOrgModalStyles();
    return (
      <Modal
        className={styles.modal}
        contentClassName={styles.modalContent}
        title="Add to an organization"
        isOpen={isOpen}
        onDismiss={this.onCancel}
      >
        <Field label="Organization">
          <OrgPicker onSelected={this.onOrgSelect} />
        </Field>
        <Field label="Role">
          <OrgRolePicker value={role} onChange={this.onOrgRoleChange} />
        </Field>
        <Modal.ButtonRow>
          <HorizontalGroup spacing="md" justify="center">
            <Button variant="secondary" fill="outline" onClick={this.onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.onAddUserToOrg}>
              Add to organization
            </Button>
          </HorizontalGroup>
        </Modal.ButtonRow>
      </Modal>
    );
  }
}

const ExternalUserTooltip: React.FC = () => {
  const theme = useTheme();
  const styles = getTooltipStyles(theme);

  return (
    <div className={styles.disabledTooltip}>
      <Tooltip
        placement="right-end"
        content={
          <div>
            This user&apos;s role is not editable because it is synchronized from your auth provider. Refer to the&nbsp;
            <a
              className={styles.tooltipItemLink}
              href={'https://grafana.com/docs/grafana/latest/auth'}
              rel="noreferrer noopener"
              target="_blank"
            >
              Grafana authentication docs
            </a>
            &nbsp;for details.
          </div>
        }
      >
        <Icon name="question-circle" />
      </Tooltip>
    </div>
  );
};

const getTooltipStyles = stylesFactory((theme: GrafanaTheme) => ({
  disabledTooltip: css`
    display: flex;
  `,
  tooltipItemLink: css`
    color: ${theme.palette.blue95};
  `,
}));
