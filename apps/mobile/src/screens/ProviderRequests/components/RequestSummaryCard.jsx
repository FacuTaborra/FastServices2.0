import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import styles from './RequestSummaryCard.styles';
import { PALETTE } from '../../HomePage/HomePage.styles';

const DEFAULT_STATUS_ICON = 'information-circle';

/**
 * Generic summary card used across provider request flows to present
 * key information about a service request. Supported content is kept
 * flexible through props so the same component can back both the
 * "solicitud" view and the presupuesto flow.
 */
export default function RequestSummaryCard({
    headerLabel,
    typeLabel,
    typeIcon = 'hammer',
    title,
    metaLabel,
    statusLabel,
    statusPrefix = 'Estado',
    statusIcon = DEFAULT_STATUS_ICON,
    details = [],
    containerStyle,
}) {
    const detailItems = Array.isArray(details)
        ? details.filter((item) => item && (item.label || item.value || item.hint))
        : [];

    return (
        <View style={[styles.card, containerStyle]}>
            {headerLabel ? <Text style={styles.headerLabel}>{headerLabel}</Text> : null}

            <View style={styles.header}>
                {typeLabel ? (
                    <View style={styles.typeBadge}>
                        <Ionicons name={typeIcon} size={14} color={PALETTE.white} />
                        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                    </View>
                ) : null}

                <View style={styles.headerText}>
                    {title ? <Text style={styles.title}>{title}</Text> : null}
                    {metaLabel ? <Text style={styles.meta}>{metaLabel}</Text> : null}
                </View>
            </View>

            {statusLabel ? (
                <View style={styles.statusRow}>
                    <Ionicons name={statusIcon} size={18} color={PALETTE.primary} />
                    <Text style={styles.statusText}>
                        {statusPrefix ? `${statusPrefix}: ${statusLabel}` : statusLabel}
                    </Text>
                </View>
            ) : null}

            {detailItems.length ? <View style={styles.divider} /> : null}

            {detailItems.map(({ icon = DEFAULT_STATUS_ICON, label, value, hint }, index) => (
                <View
                    key={`detail-${index}`}
                    style={[styles.detailRow, index === detailItems.length - 1 ? styles.detailRowLast : null]}
                >
                    {icon ? (
                        <Ionicons name={icon} size={20} color={PALETTE.textSecondary} style={styles.detailIcon} />
                    ) : null}
                    <View style={styles.detailColumn}>
                        {label ? <Text style={styles.detailLabel}>{label}</Text> : null}
                        {value ? <Text style={styles.detailValue}>{value}</Text> : null}
                        {hint ? <Text style={styles.detailHint}>{hint}</Text> : null}
                    </View>
                </View>
            ))}
        </View>
    );
}
