import mysql from '../../../common/mysql_worker';
import { IApiResponse } from '../../../common/apiTypes';
import { usePrisma } from '../..';
import { boolean, number, string, z, ZodError } from 'zod';
import opsUtils, { getSearchQuery, zValidNumber } from '../../../utils/opsUtils';
import { uuid } from 'uuidv4';
import { encrypt } from '../../../utils/cryptoUtils';

const Props = z.object({
    accountId: zValidNumber,
});

type IProps = z.infer<typeof Props>;

function generateApiKey() {
    return uuid();
}

export default async function createApiKey(props: IProps): Promise<IApiResponse> {
    const aurora = mysql();
    try {
        let useProps = Props.parse(props);
        const { accountId } = useProps;

        const apiKey = generateApiKey();

        await usePrisma.account.update({ where: { id: accountId }, data: { hashedApiKey: apiKey } });

        return { data: { apiKey: apiKey } };
    } catch (e) {
        if (e instanceof ZodError) {
            console.log(e.flatten());
            //@ts-ignore
            return { error: e.flatten() };
        } else {
            throw e;
        }
    }
}
