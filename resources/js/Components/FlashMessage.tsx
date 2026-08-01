import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { App } from 'antd';
import { PageProps } from '@/types';

export default function FlashMessage() {
    const { flash } = usePage<PageProps>().props;
    const { message } = App.useApp();

    useEffect(() => {
        if (flash?.success) message.success(flash.success);
        if (flash?.error) message.error(flash.error);
    }, [flash?.success, flash?.error]);

    return null;
}
