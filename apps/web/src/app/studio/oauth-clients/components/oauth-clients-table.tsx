"use client";

import {
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, EmptyState } from "@heroui-pro/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import type {
  OAuthClientDetail,
  OAuthClientListItem,
} from "@/lib/queries/oauth-clients";

type StatusFilter = "all" | "enabled" | "disabled";

const dateFormatter = new Intl.DateTimeFormat("en-SG", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const createdTime = (client: OAuthClientListItem) =>
  client.createdAt ? new Date(client.createdAt).getTime() : 0;

const dateTimeFormatter = new Intl.DateTimeFormat("en-SG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OAuthClientsTable() {
  const [clients, setClients] = useState<OAuthClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/oauth-clients");
      if (response.ok) {
        const data = (await response.json()) as OAuthClientListItem[];
        startTransition(() => {
          setClients(data);
        });
      } else {
        console.error("Failed to fetch OAuth clients:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch OAuth clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleToggleDisabled = (clientId: string, disabled: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/studio/oauth-clients/${encodeURIComponent(clientId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disabled }),
          },
        );

        if (response.ok) {
          await fetchClients();
        } else {
          const error = await response.json();
          alert(`Failed to update client: ${error.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to update OAuth client:", error);
        alert("Failed to update OAuth client");
      }
    });
  };

  const handleDelete = (clientId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/studio/oauth-clients/${encodeURIComponent(clientId)}`,
          { method: "DELETE" },
        );

        if (response.ok) {
          await fetchClients();
        } else {
          const error = await response.json();
          alert(`Failed to delete client: ${error.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to delete OAuth client:", error);
        alert("Failed to delete OAuth client");
      }
    });
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === "" ||
      (client.name?.toLowerCase().includes(query) ?? false) ||
      client.clientId.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "disabled" && client.disabled) ||
      (statusFilter === "enabled" && !client.disabled);

    return matchesSearch && matchesStatus;
  });

  const columns: DataGridColumn<OAuthClientListItem>[] = [
    {
      id: "name",
      header: "Name",
      isRowHeader: true,
      allowsSorting: true,
      minWidth: 220,
      sortFn: (a, b) =>
        (a.name ?? a.clientId).localeCompare(b.name ?? b.clientId),
      cell: (client) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{client.name || "Unnamed client"}</span>
          <span className="font-mono text-muted text-xs">
            {client.clientId}
          </span>
          <Chip size="sm" variant="soft" color="default">
            {client.public ? "public" : "confidential"}
          </Chip>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      allowsSorting: true,
      sortFn: (a, b) =>
        Number(a.disabled ?? false) - Number(b.disabled ?? false),
      cell: (client) => (
        <Chip
          size="sm"
          variant="soft"
          color={client.disabled ? "danger" : "success"}
        >
          {client.disabled ? "disabled" : "enabled"}
        </Chip>
      ),
    },
    {
      id: "tokens",
      header: "Tokens",
      align: "end",
      allowsSorting: true,
      sortFn: (a, b) => a.activeTokenCount - b.activeTokenCount,
      cell: (client) => (
        <span className="tabular-nums">{client.activeTokenCount}</span>
      ),
    },
    {
      id: "consents",
      header: "Consents",
      align: "end",
      allowsSorting: true,
      sortFn: (a, b) => a.consentCount - b.consentCount,
      cell: (client) => (
        <span className="tabular-nums">{client.consentCount}</span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      allowsSorting: true,
      sortFn: (a, b) => createdTime(a) - createdTime(b),
      cell: (client) => (
        <span className="text-muted text-sm tabular-nums">
          {client.createdAt
            ? dateFormatter.format(new Date(client.createdAt))
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      cell: (client) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setDetailClientId(client.clientId)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={isPending}
            onPress={() =>
              handleToggleDisabled(client.clientId, !client.disabled)
            }
          >
            {client.disabled ? "Enable" : "Disable"}
          </Button>
          <AlertDialog>
            <Button variant="ghost" size="sm" isDisabled={isPending}>
              Delete
            </Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>
                      Delete OAuth client?
                    </AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p>
                      This permanently deletes &ldquo;
                      {client.name || client.clientId}&rdquo; along with all its
                      access tokens, refresh tokens, and consents. This cannot
                      be undone.
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      slot="close"
                      variant="danger"
                      onPress={() => handleDelete(client.clientId)}
                    >
                      Delete
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl">OAuth Clients</h1>
        <p className="text-muted">
          Manage applications registered with your OAuth provider
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <TextField
            aria-label="Search OAuth clients"
            type="search"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <Input
              className="max-w-md"
              placeholder="Search by name or client ID..."
            />
          </TextField>
        </div>
        <Select
          aria-label="Filter by status"
          className="w-45"
          value={statusFilter}
          onChange={(value) => {
            if (value) setStatusFilter(value as StatusFilter);
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="All Clients">
                All Clients
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="enabled" textValue="Enabled">
                Enabled
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="disabled" textValue="Disabled">
                Disabled
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted">Loading OAuth clients...</p>
          </Card.Content>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>No OAuth clients yet</EmptyState.Title>
                <EmptyState.Description>
                  No applications have registered with your OAuth provider yet.
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>
              All Clients ({filteredClients.length}
              {filteredClients.length !== clients.length &&
                ` of ${clients.length}`}
              )
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <DataGrid
              aria-label="OAuth clients"
              columns={columns}
              contentClassName="min-w-[720px]"
              data={filteredClients}
              defaultSortDescriptor={{
                column: "createdAt",
                direction: "descending",
              }}
              getRowId={(client) => client.id}
              renderEmptyState={() => (
                <div className="py-6">
                  <EmptyState>
                    <EmptyState.Header>
                      <EmptyState.Title>
                        No OAuth clients found
                      </EmptyState.Title>
                      <EmptyState.Description>
                        Try adjusting your search or filter criteria
                      </EmptyState.Description>
                    </EmptyState.Header>
                    <EmptyState.Content>
                      <Button
                        variant="outline"
                        onPress={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </EmptyState.Content>
                  </EmptyState>
                </div>
              )}
            />
          </Card.Content>
        </Card>
      )}

      <OAuthClientDetailModal
        clientId={detailClientId}
        onClose={() => setDetailClientId(null)}
      />
    </div>
  );
}

function OAuthClientDetailModal({
  clientId,
  onClose,
}: {
  clientId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<OAuthClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/studio/oauth-clients/${encodeURIComponent(clientId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: OAuthClientDetail | null) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error) => {
        console.error("Failed to fetch OAuth client detail:", error);
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={clientId !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {detail?.client.name || "OAuth client"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-6">
              {isLoading ? (
                <p className="py-8 text-center text-muted">Loading...</p>
              ) : !detail ? (
                <p className="py-8 text-center text-muted">
                  Unable to load client details.
                </p>
              ) : (
                <>
                  <section className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Client</h3>
                    <dl className="flex flex-col gap-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-muted">Client ID:</dt>
                        <dd className="break-all font-mono">
                          {detail.client.clientId}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted">Type:</dt>
                        <dd>
                          {detail.client.public ? "Public" : "Confidential"}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-muted">Scopes:</dt>
                        <dd className="flex flex-wrap gap-1">
                          {detail.client.scopes?.length ? (
                            detail.client.scopes.map((scope) => (
                              <Chip key={scope} size="sm" variant="soft">
                                {scope}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-muted">Redirect URIs:</dt>
                        <dd className="flex flex-col gap-1 font-mono text-xs">
                          {detail.client.redirectUris.length ? (
                            detail.client.redirectUris.map((uri) => (
                              <span key={uri} className="break-all">
                                {uri}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">
                      Active tokens ({detail.activeTokens.length})
                    </h3>
                    {detail.activeTokens.length === 0 ? (
                      <p className="text-muted text-sm">No active tokens.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {detail.activeTokens.map((token) => (
                          <li
                            key={token.id}
                            className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
                          >
                            <span className="font-medium">
                              {token.userName ||
                                token.userEmail ||
                                "Unknown user"}
                            </span>
                            <span className="text-muted text-xs">
                              Expires{" "}
                              {dateTimeFormatter.format(
                                new Date(token.expiresAt),
                              )}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {token.scopes.map((scope) => (
                                <Chip
                                  key={scope}
                                  size="sm"
                                  variant="soft"
                                  color="default"
                                >
                                  {scope}
                                </Chip>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">
                      Consents ({detail.consents.length})
                    </h3>
                    {detail.consents.length === 0 ? (
                      <p className="text-muted text-sm">
                        No consents recorded.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {detail.consents.map((consent) => (
                          <li
                            key={consent.id}
                            className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
                          >
                            <span className="font-medium">
                              {consent.userName ||
                                consent.userEmail ||
                                "Unknown user"}
                            </span>
                            <span className="text-muted text-xs">
                              Consented{" "}
                              {dateTimeFormatter.format(
                                new Date(consent.createdAt),
                              )}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {consent.scopes.map((scope) => (
                                <Chip
                                  key={scope}
                                  size="sm"
                                  variant="soft"
                                  color="default"
                                >
                                  {scope}
                                </Chip>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="outline">
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
