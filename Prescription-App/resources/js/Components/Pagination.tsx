import { Pagination as AntPagination } from 'antd';

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    meta: PaginationMeta;
    onChange: (page: number) => void;
}

export default function Pagination({ meta, onChange }: Props) {
    if (meta.last_page <= 1) return null;

    return (
        <div className="flex justify-center py-2">
            <AntPagination
                current={meta.current_page}
                total={meta.total}
                pageSize={meta.per_page}
                showSizeChanger={false}
                onChange={onChange}
            />
        </div>
    );
}
