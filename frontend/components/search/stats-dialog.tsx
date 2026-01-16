'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Sector
} from 'recharts'
import { useSearch } from '@/hooks/use-search'
import { BarChart2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TooltipContent = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-popover/95 border text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm backdrop-blur-sm whitespace-nowrap">
        <div className="font-semibold mb-1 text-left">{label}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Count:</span>
            <span className="font-mono font-medium text-foreground text-sm">
                {value.toLocaleString()}
            </span>
        </div>
    </div>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return <TooltipContent label={label || payload[0].name} value={payload[0].value} />
    }
    return null
}

const VENUE_FIELDS: Record<string, string> = {
    // AI
    "AAAI": "AI", "IJCAI": "AI",
    // Vision
    "CVPR": "Vision", "ECCV": "Vision", "ICCV": "Vision",
    // ML
    "ICML": "ML", "KDD": "ML", "ICLR": "ML", "NeurIPS": "ML", "NIPS": "ML",
    // NLP
    "ACL": "NLP", "EMNLP": "NLP", "NAACL": "NLP",
    // Web & IR
    "SIGIR": "Web & IR", "WWW": "Web & IR",
    // Arch
    "ASPLOS": "Arch", "ISCA": "Arch", "MICRO": "Arch", "HPCA": "Arch",
    // Networks
    "SIGCOMM": "Networks", "NSDI": "Networks",
    // Security
    "CCS": "Security", "S&P": "Security", "USENIX Security": "Security", "NDSS": "Security", "PETS": "Security",
    // DB
    "SIGMOD": "DB", "VLDB": "DB", "ICDE": "DB", "PODS": "DB",
    // HPC
    "SC": "HPC", "HPDC": "HPC", "ICS": "HPC",
    // Mobile
    "MobiCom": "Mobile", "MobiSys": "Mobile", "SenSys": "Mobile",
    // Metrics
    "IMC": "Metrics", "SIGMETRICS": "Metrics",
    // OS
    "SOSP": "OS", "OSDI": "OS", "FAST": "OS", "USENIX ATC": "OS", "EuroSys": "OS", "ATC": "OS",
    // PL
    "PLDI": "PL", "POPL": "PL", "ICFP": "PL", "OOPSLA": "PL",
    // SE
    "FSE": "SE", "ICSE": "SE", "ASE": "SE", "ISSTA": "SE",
    // Theory
    "FOCS": "Theory", "SODA": "Theory", "STOC": "Theory",
    // Crypto
    "CRYPTO": "Crypto", "EUROCRYPT": "Crypto",
    // Logic
    "CAV": "Logic", "LICS": "Logic",
    // Graphics
    "SIGGRAPH": "Graphics", "Eurographics": "Graphics",
    // HCI
    "CHI": "HCI", "UbiComp": "HCI", "UIST": "HCI",
    // Robotics
    "ICRA": "Robotics", "IROS": "Robotics", "RSS": "Robotics",
    // Comp. Bio
    "ISMB": "Comp. Bio", "RECOMB": "Comp. Bio",
    // EDA
    "DAC": "EDA", "ICCAD": "EDA",
    // Embedded
    "EMSOFT": "Embedded", "RTAS": "Embedded", "RTSS": "Embedded",
    // Vis
    "VIS": "Visualization", "VR": "Visualization",
    // ECom
    "EC": "ECom", "WINE": "ECom",
    // CSEd
    "SIGCSE": "CSEd"
}

// Muted / Professional Palette (Tailwind 500/600 mix - readable but not neon)
const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
    '#84cc16', // lime-500
    '#d946ef', // fuchsia-500
    '#0ea5e9', // sky-500
    '#f43f5e', // rose-500
    '#a855f7', // purple-500
    '#22c55e', // green-500
    '#64748b', // slate-500
    '#e11d48', // rose-600
    '#7c3aed', // violet-600
    '#059669', // emerald-600
    '#d97706', // amber-600
]

export function StatsDialog() {
    const { data } = useSearch()
    const facets = data?.facetDistribution
    const [activeField, setActiveField] = React.useState<string | null>(null)

    const yearData = React.useMemo(() => {
        if (!facets?.year) return []
        return Object.entries(facets.year)
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    }, [facets])

    const venueData = React.useMemo(() => {
        if (!facets?.venue) return []
        return Object.entries(facets.venue)
            .map(([venue, count]) => ({ venue, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }, [facets])

    const fieldData = React.useMemo(() => {
        if (!facets?.venue) return []
        const counts: Record<string, number> = {}

        Object.entries(facets.venue).forEach(([venue, count]) => {
            let field = "Other"
            const upperVenue = venue.toUpperCase()

            for (const [key, val] of Object.entries(VENUE_FIELDS)) {
                if (upperVenue.includes(key.toUpperCase())) {
                    field = val
                    break
                }
            }
            counts[field] = (counts[field] || 0) + count
        })

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => {
                // Sort Pie Slices: Other Last, then by Value Descending
                if (a.name === 'Other') return 1
                if (b.name === 'Other') return -1
                return b.value - a.value
            })
            .filter(item => item.value > 0)
    }, [facets])

    const activeIndex = React.useMemo(() => {
        return fieldData.findIndex(item => item.name === activeField)
    }, [activeField, fieldData])

    // Custom shape renderer handling both normal and active states
    const renderShape = React.useCallback((props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props
        const isActive = activeField !== null && index === activeIndex

        return (
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={isActive ? outerRadius + 8 : outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        )
    }, [activeField, activeIndex])

    const renderLegend = React.useCallback((props: any) => {
        const { payload } = props;
        if (!payload) return null;

        const sortedPayload = [...payload].sort((a: any, b: any) => {
            if (a.value === 'Other') return 1;
            if (b.value === 'Other') return -1;
            return a.value.localeCompare(b.value);
        });

        return (
            <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-3 px-2" style={{ fontSize: '11px', color: '#52525b' }}>
                {sortedPayload.map((entry: any, index: number) => (
                    <li
                        key={`item-${index}`}
                        className="group relative flex items-center gap-1.5 cursor-pointer"
                        onMouseEnter={() => setActiveField(entry.value)}
                        onMouseLeave={() => setActiveField(null)}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none drop-shadow-md">
                            <TooltipContent label={entry.value} value={entry.payload.value} />
                        </div>

                        <div
                            className="w-2.5 h-2.5"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={`transition-colors ${activeField === entry.value ? 'font-bold text-foreground' : 'group-hover:text-foreground'}`}>
                            {entry.value}
                        </span>
                    </li>
                ))}
            </ul>
        );
    }, [activeField])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Stats
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl bg-background border rounded-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Search Statistics</DialogTitle>
                </DialogHeader>
                <div className="grid gap-8 py-4 md:grid-cols-2">
                    <div className="space-y-3 md:col-span-2">
                        <h4 className="text-sm font-medium">Papers by Year</h4>
                        <div className="h-[200px] w-full border rounded-md p-4 bg-card/50">
                            {yearData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearData}>
                                        <XAxis
                                            dataKey="year"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                            width={45}
                                        />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2, radius: 4 }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Top Venues</h4>
                        <div className="h-[300px] w-full border rounded-md p-4 bg-card/50">
                            {venueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={venueData}
                                        layout="vertical"
                                        margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                                        barCategoryGap={4}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="venue"
                                            type="category"
                                            width={100}
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={0}
                                            tickFormatter={(value: string) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                        />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2, radius: 4 }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="hsl(var(--primary))"
                                            radius={[0, 4, 4, 0]}
                                            barSize={16}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Distribution by Field</h4>
                        <div className="h-[360px] w-full border rounded-md p-4 bg-card/50">
                            {fieldData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={fieldData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            nameKey="name"
                                            shape={renderShape}
                                        >
                                            {fieldData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.name === 'Other' ? '#171717' : COLORS[index % COLORS.length]}
                                                    strokeWidth={0}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            content={renderLegend}
                                            verticalAlign="bottom"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
